export interface Group {
  id: string;
  name: string;
  description: string | null;
  photo_url: string | null;
  invite_token: string; // nanoid — used in /join/[token]
  created_by: string; // FK → users.id
  created_at: string;
}

export type GroupInsert = Omit<Group, "id" | "created_at">;
export type GroupUpdate = Partial<Omit<Group, "id" | "created_at">>;

export interface GroupMember {
  group_id: string;
  user_id: string;
  joined_at: string;
}

export type GroupMemberInsert = Omit<GroupMember, "joined_at">;
