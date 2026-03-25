You have a place. Actually copilot. This one. import { ValidationError } from "@/lib/utils/errors";
import type { IProfileRepository } from "./profile.repository.interface";
import type { User, UserUpdate } from "@/app/(auth)/user.entity";

export async function getProfile(
  repo: IProfileRepository,
  userId: string
): Promise<User> {
  const profile = await repo.getUserById(userId);

  if (!profile) {
    throw new ValidationError("Profile not found.");
  }

  return profile;
}

export async function updateProfile(
  repo: IProfileRepository,
  userId: string,
  updates: UserUpdate
): Promise<User> {
  // Validate name if provided
  if (updates.full_name !== undefined) {
    const name = updates.full_name.trim();
    if (name.length < 2) {
      throw new ValidationError("Name must be at least 2 characters.");
    }
    updates.full_name = name;
  }

  // Validate phone if provided
  if (updates.phone_number !== undefined && updates.phone_number !== null) {
    const phone = updates.phone_number.replace(/\D/g, "");
    if (phone.length > 0 && phone.length < 10) {
      throw new ValidationError("Phone number must be at least 10 digits.");
    }
    updates.phone_number = phone || null;
  }

  // Trim address if provided
  if (updates.address !== undefined && updates.address !== null) {
    updates.address = updates.address.trim() || null;
  }

  return repo.updateUser(userId, updates);
}

export async function saveAvatarUrl(
  repo: IProfileRepository,
  userId: string,
  url: string
): Promise<User> {
  if (!url || url.trim().length === 0) {
    throw new ValidationError("Avatar URL cannot be empty.");
  }

  return repo.updateAvatarUrl(userId, url.trim());
}

export async function requestAccountDeletion(
  repo: IProfileRepository,
  userId: string
): Promise<void> {
  // Get all groups the user is a member of
  const groupIds = await repo.getUserGroupIds(userId);

  // Check for unsettled balances in any group
  for (const groupId of groupIds) {
    const netBalance = await repo.getGroupNetBalance(groupId, userId);
    if (netBalance !== 0) {
      throw new ValidationError(
        "You have unsettled debts. Please settle all expenses before deleting your account."
      );
    }
  }

  await repo.deleteAccount(userId);
}
