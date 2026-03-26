import type {
  Group,
  GroupInsert,
  GroupUpdate,
  GroupMember,
} from "./group.entity";

export interface GroupWithMemberCount extends Group {
  member_count: number;
}

export interface MemberWithDetails {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  joined_at: string;
}

export interface IGroupRepository {
  getGroupsForUser(userId: string): Promise<GroupWithMemberCount[]>;

  getGroupById(groupId: string): Promise<Group | null>;

  getGroupByInviteToken(token: string): Promise<Group | null>;

  createGroup(data: Omit<GroupInsert, "invite_token">): Promise<Group>;

  updateGroup(groupId: string, updates: GroupUpdate): Promise<Group>;

  deleteGroup(groupId: string): Promise<void>;

  uploadGroupPhoto(groupId: string, file: File): Promise<string>;

  addMember(groupId: string, userId: string): Promise<GroupMember>;

  removeMember(groupId: string, userId: string): Promise<void>;

  isMember(groupId: string, userId: string): Promise<boolean>;

  getMembersWithDetails(groupId: string): Promise<MemberWithDetails[]>;

  getMemberCount(groupId: string): Promise<number>;

  regenerateInviteToken(groupId: string): Promise<string>;

  getGroupNetBalances(
    groupId: string,
  ): Promise<Array<{ user_id: string; net_amount: number }>>;
}
