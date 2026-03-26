import type { User, UserUpdate } from "@/app/(auth)/user.entity";

export interface IProfileRepository {
  getUserById(userId: string): Promise<User | null>;

  updateUser(userId: string, updates: UserUpdate): Promise<User>;

  updateAvatarUrl(userId: string, url: string): Promise<User>;

  uploadAvatar(userId: string, file: File): Promise<string>;

  deleteAccount(userId: string): Promise<void>;

  getUserGroupIds(userId: string): Promise<string[]>;

  getGroupNetBalance(groupId: string, userId: string): Promise<number>;
}
