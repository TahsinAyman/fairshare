import { createClient } from "@/lib/supabase/server";
import { AuthorizationError, ValidationError } from "@/lib/utils/errors";
import type { Group, GroupUpdate } from "./group.entity";
import type {
  IGroupRepository,
  GroupWithMemberCount,
  MemberWithDetails,
} from "./group.repository.interface";

async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

async function requireAuthUser() {
  const user = await getAuthUser();
  if (!user) {
    throw new AuthorizationError("You must be logged in.");
  }
  return user;
}

export async function getMyGroups(
  repo: IGroupRepository,
): Promise<GroupWithMemberCount[]> {
  const user = await requireAuthUser();
  return repo.getGroupsForUser(user.id);
}

export async function getGroupDetails(
  repo: IGroupRepository,
  groupId: string,
): Promise<{ group: Group; members: MemberWithDetails[] }> {
  const user = await requireAuthUser();

  const isMember = await repo.isMember(groupId, user.id);
  if (!isMember) {
    throw new AuthorizationError(
      "You do not have permission to view this group.",
    );
  }

  const group = await repo.getGroupById(groupId);
  if (!group) {
    throw new ValidationError("Group not found.");
  }

  const members = await repo.getMembersWithDetails(groupId);

  return { group, members };
}

export async function createGroup(
  repo: IGroupRepository,
  name: string,
  description: string | null,
): Promise<Group> {
  const user = await requireAuthUser();

  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new ValidationError("Group name is required.");
  }
  if (trimmedName.length > 50) {
    throw new ValidationError("Group name must be 50 characters or less.");
  }

  const trimmedDescription = description?.trim() || null;

  const group = await repo.createGroup({
    name: trimmedName,
    description: trimmedDescription,
    photo_url: null,
    created_by: user.id,
  });

  // Add creator as first member
  await repo.addMember(group.id, user.id);

  return group;
}

export async function updateGroup(
  repo: IGroupRepository,
  groupId: string,
  updates: GroupUpdate,
): Promise<Group> {
  const user = await requireAuthUser();

  const group = await repo.getGroupById(groupId);
  if (!group) {
    throw new ValidationError("Group not found.");
  }

  if (group.created_by !== user.id) {
    throw new AuthorizationError("Only the group creator can edit this group.");
  }

  // Validate and trim name if provided
  if (updates.name !== undefined) {
    const trimmedName = updates.name.trim();
    if (!trimmedName) {
      throw new ValidationError("Group name is required.");
    }
    if (trimmedName.length > 50) {
      throw new ValidationError("Group name must be 50 characters or less.");
    }
    updates.name = trimmedName;
  }

  // Trim description if provided
  if (updates.description !== undefined && updates.description !== null) {
    updates.description = updates.description.trim() || null;
  }

  return repo.updateGroup(groupId, updates);
}

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function uploadGroupPhoto(
  repo: IGroupRepository,
  groupId: string,
  file: File,
): Promise<Group> {
  const user = await requireAuthUser();

  const group = await repo.getGroupById(groupId);
  if (!group) {
    throw new ValidationError("Group not found.");
  }

  if (group.created_by !== user.id) {
    throw new AuthorizationError(
      "Only the group creator can upload a group photo.",
    );
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new ValidationError("Photo must be a JPG, PNG, or WebP image.");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new ValidationError("Photo must be smaller than 5MB.");
  }

  const photoUrl = await repo.uploadGroupPhoto(groupId, file);

  return repo.updateGroup(groupId, { photo_url: photoUrl });
}

export async function deleteGroup(
  repo: IGroupRepository,
  groupId: string,
): Promise<void> {
  const user = await requireAuthUser();

  const group = await repo.getGroupById(groupId);
  if (!group) {
    throw new ValidationError("Group not found.");
  }

  if (group.created_by !== user.id) {
    throw new AuthorizationError(
      "Only the group creator can delete this group.",
    );
  }

  // Check if all balances are settled
  const balances = await repo.getGroupNetBalances(groupId);
  const hasUnsettledBalances = balances.some((b) => b.net_amount !== 0);

  if (hasUnsettledBalances) {
    throw new ValidationError(
      "All expenses must be settled before a group can be deleted.",
    );
  }

  await repo.deleteGroup(groupId);
}

export async function getInviteUrl(
  repo: IGroupRepository,
  groupId: string,
): Promise<string> {
  const user = await requireAuthUser();

  const isMember = await repo.isMember(groupId, user.id);
  if (!isMember) {
    throw new AuthorizationError("Only group members can get the invite link.");
  }

  const group = await repo.getGroupById(groupId);
  if (!group) {
    throw new ValidationError("Group not found.");
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${baseUrl}/join/${group.invite_token}`;
}

export async function regenerateInviteToken(
  repo: IGroupRepository,
  groupId: string,
): Promise<string> {
  const user = await requireAuthUser();

  const group = await repo.getGroupById(groupId);
  if (!group) {
    throw new ValidationError("Group not found.");
  }

  if (group.created_by !== user.id) {
    throw new AuthorizationError(
      "Only the group creator can regenerate the invite link.",
    );
  }

  const newToken = await repo.regenerateInviteToken(groupId);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${baseUrl}/join/${newToken}`;
}

export async function joinViaToken(
  repo: IGroupRepository,
  token: string,
): Promise<Group> {
  const user = await requireAuthUser();

  const group = await repo.getGroupByInviteToken(token);
  if (!group) {
    throw new ValidationError("Invalid or expired invite link.");
  }

  // Check if already a member (idempotent)
  const isMember = await repo.isMember(group.id, user.id);
  if (isMember) {
    return group;
  }

  await repo.addMember(group.id, user.id);
  return group;
}

export async function leaveGroup(
  repo: IGroupRepository,
  groupId: string,
): Promise<void> {
  const user = await requireAuthUser();

  const group = await repo.getGroupById(groupId);
  if (!group) {
    throw new ValidationError("Group not found.");
  }

  if (group.created_by === user.id) {
    throw new ValidationError(
      "The group creator cannot leave. Transfer ownership or delete the group.",
    );
  }

  // Check user's balance
  const balances = await repo.getGroupNetBalances(groupId);
  const userBalance = balances.find((b) => b.user_id === user.id);

  if (userBalance && userBalance.net_amount !== 0) {
    throw new ValidationError(
      "You must settle all expenses before leaving the group.",
    );
  }

  await repo.removeMember(groupId, user.id);
}

export async function getGroupByToken(
  repo: IGroupRepository,
  token: string,
): Promise<{ group: Group; memberCount: number } | null> {
  const group = await repo.getGroupByInviteToken(token);
  if (!group) {
    return null;
  }

  const memberCount = await repo.getMemberCount(group.id);
  return { group, memberCount };
}
