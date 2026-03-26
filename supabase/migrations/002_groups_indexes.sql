-- Groups module indexes and policies
-- Additional indexes for query performance

-- Index for looking up groups by invite token
create index if not exists idx_groups_invite_token on public.groups(invite_token);

-- Index for looking up groups by creator
create index if not exists idx_groups_created_by on public.groups(created_by);

-- Index for looking up memberships by user
create index if not exists idx_group_members_user_id on public.group_members(user_id);

-- Policy to allow reading group by invite token (for join page before joining)
create policy "groups_select_by_token" on public.groups for select
  using (invite_token is not null);

-- Policy to allow members to delete themselves from a group
create policy "group_members_delete_self" on public.group_members for delete
  using (auth.uid() = user_id);
