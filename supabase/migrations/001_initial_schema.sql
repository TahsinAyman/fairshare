-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── USERS ──────────────────────────────────────────────────────────────────
create table public.users (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null unique,
  full_name     text not null,
  avatar_url    text,
  phone_number  text,
  date_of_birth date,
  address       text,
  created_at    timestamptz default now() not null
);

-- Auto-insert user row on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── GROUPS ─────────────────────────────────────────────────────────────────
create table public.groups (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  description   text,
  photo_url     text,
  invite_token  text not null unique,
  created_by    uuid not null references public.users(id) on delete restrict,
  created_at    timestamptz default now() not null
);

-- ─── GROUP MEMBERS ───────────────────────────────────────────────────────────
create table public.group_members (
  group_id   uuid not null references public.groups(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  joined_at  timestamptz default now() not null,
  primary key (group_id, user_id)
);

-- ─── EXPENSES ────────────────────────────────────────────────────────────────
create table public.expenses (
  id            uuid primary key default uuid_generate_v4(),
  group_id      uuid not null references public.groups(id) on delete cascade,
  paid_by       uuid not null references public.users(id) on delete restrict,
  description   text not null,
  total_amount  bigint not null check (total_amount > 0),  -- paisa, integer only
  split_mode    text not null check (split_mode in ('equal', 'percentage', 'custom')),
  receipt_url   text,
  created_at    timestamptz default now() not null
);

-- ─── EXPENSE SPLITS ──────────────────────────────────────────────────────────
create table public.expense_splits (
  id           uuid primary key default uuid_generate_v4(),
  expense_id   uuid not null references public.expenses(id) on delete cascade,
  group_id     uuid not null references public.groups(id) on delete cascade, -- denormalised
  user_id      uuid not null references public.users(id) on delete restrict,
  owed_amount  bigint not null check (owed_amount >= 0)  -- paisa, integer only
);

-- Critical index for balance calculation performance
create index idx_expense_splits_group_user on public.expense_splits(group_id, user_id);

-- ─── SETTLEMENTS ─────────────────────────────────────────────────────────────
create table public.settlements (
  id            uuid primary key default uuid_generate_v4(),
  group_id      uuid not null references public.groups(id) on delete cascade,
  from_user_id  uuid not null references public.users(id) on delete restrict,
  to_user_id    uuid not null references public.users(id) on delete restrict,
  amount        bigint not null check (amount > 0),  -- paisa, integer only
  created_at    timestamptz default now() not null
);

-- ─── BALANCE VIEW FUNCTION ────────────────────────────────────────────────────
create or replace function public.get_group_balances(p_group_id uuid)
returns table (
  user_id    uuid,
  full_name  text,
  avatar_url text,
  net_amount bigint  -- paisa: positive = owed money, negative = owes money
) language sql security definer as $$
  select
    u.id                                                       as user_id,
    u.full_name,
    u.avatar_url,
    coalesce(paid.total_paid, 0) - coalesce(owed.total_owed, 0) as net_amount
  from public.group_members gm
  join public.users u on u.id = gm.user_id
  left join (
    select paid_by, sum(total_amount) as total_paid
    from public.expenses
    where group_id = p_group_id
    group by paid_by
  ) paid on paid.paid_by = u.id
  left join (
    select user_id, sum(owed_amount) as total_owed
    from public.expense_splits
    where group_id = p_group_id
    group by user_id
  ) owed on owed.user_id = u.id
  where gm.group_id = p_group_id;
$$;

-- ─── ATOMIC EXPENSE INSERT RPC ───────────────────────────────────────────────
create or replace function public.insert_expense_with_splits(
  p_group_id    uuid,
  p_paid_by     uuid,
  p_description text,
  p_total_amount bigint,
  p_split_mode  text,
  p_receipt_url text,
  p_splits      jsonb   -- array of {user_id: uuid, owed_amount: bigint}
) returns jsonb language plpgsql security definer as $$
declare
  v_expense_id uuid;
  v_split      jsonb;
begin
  -- Insert the expense
  insert into public.expenses (group_id, paid_by, description, total_amount, split_mode, receipt_url)
  values (p_group_id, p_paid_by, p_description, p_total_amount, p_split_mode, p_receipt_url)
  returning id into v_expense_id;

  -- Insert each split atomically
  for v_split in select * from jsonb_array_elements(p_splits) loop
    insert into public.expense_splits (expense_id, group_id, user_id, owed_amount)
    values (
      v_expense_id,
      p_group_id,
      (v_split->>'user_id')::uuid,
      (v_split->>'owed_amount')::bigint
    );
  end loop;

  return jsonb_build_object('expense_id', v_expense_id);
end;
$$;

-- ─── ROW LEVELSECURITY ───────────────────────────────────────────────────────
alter table public.users          enable row level security;
alter table public.groups         enable row level security;
alter table public.group_members  enable row level security;
alter table public.expenses       enable row level security;
alter table public.expense_splits enable row level security;
alter table public.settlements    enable row level security;

-- users: can read own row, update own row
create policy "users_select_own" on public.users for select using (auth.uid() = id);
create policy "users_update_own" on public.users for update using (auth.uid() = id);

-- groups: members can read; creator can update/delete
create policy "groups_select_member" on public.groups for select
  using (exists (select 1 from public.group_members where group_id = id and user_id = auth.uid()));
create policy "groups_insert_auth" on public.groups for insert with check (auth.uid() = created_by);
create policy "groups_update_creator" on public.groups for update using (auth.uid() = created_by);
create policy "groups_delete_creator" on public.groups for delete using (auth.uid() = created_by);

-- group_members: members can read; anyone can insert (joining via token handled in service)
create policy "group_members_select_member" on public.group_members for select
  using (exists (select 1 from public.group_members gm2 where gm2.group_id = group_id and gm2.user_id = auth.uid()));
create policy "group_members_insert_auth" on public.group_members for insert with check (auth.uid() = user_id);

-- expenses: group members only
create policy "expenses_select_member" on public.expenses for select
  using (exists (select 1 from public.group_members where group_id = expenses.group_id and user_id = auth.uid()));
create policy "expenses_insert_member" on public.expenses for insert
  with check (exists (select 1 from public.group_members where group_id = expenses.group_id and user_id = auth.uid()));
create policy "expenses_delete_payer" on public.expenses for delete using (auth.uid() = paid_by);

-- expense_splits: same as expenses
create policy "expense_splits_select_member" on public.expense_splits for select
  using (exists (select 1 from public.group_members where group_id = expense_splits.group_id and user_id = auth.uid()));
create policy "expense_splits_insert_member" on public.expense_splits for insert
  with check (exists (select 1 from public.group_members where group_id = expense_splits.group_id and user_id = auth.uid()));

-- settlements: group members only
create policy "settlements_select_member" on public.settlements for select
  using (exists (select 1 from public.group_members where group_id = settlements.group_id and user_id = auth.uid()));
create policy "settlements_insert_member" on public.settlements for insert
  with check (exists (select 1 from public.group_members where group_id = settlements.group_id and user_id = auth.uid()));
