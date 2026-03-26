import { createClient } from "@/lib/supabase/server";
import { DatabaseError } from "@/lib/utils/errors";
import type { User, UserUpdate } from "@/app/(auth)/user.entity";
import type { IProfileRepository } from "./profile.repository.interface";

export class ProfileRepository implements IProfileRepository {
  async getUserById(userId: string): Promise<User | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new DatabaseError(error.message, error);
    }

    return data as User;
  }

  async updateUser(userId: string, updates: UserUpdate): Promise<User> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      throw new DatabaseError(error.message, error);
    }

    return data as User;
  }

  async updateAvatarUrl(userId: string, url: string): Promise<User> {
    return this.updateUser(userId, { avatar_url: url });
  }

  async deleteAccount(userId: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase.rpc("delete_user_account", {
      p_user_id: userId,
    });

    if (error) {
      throw new DatabaseError(error.message, error);
    }
  }

  async getUserGroupIds(userId: string): Promise<string[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", userId);

    if (error) {
      throw new DatabaseError(error.message, error);
    }

    return (data || []).map((m) => m.group_id as string);
  }

  async getGroupNetBalance(groupId: string, userId: string): Promise<number> {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("get_group_balances", {
      p_group_id: groupId,
    });

    if (error) {
      throw new DatabaseError(error.message, error);
    }

    const userBalance = data?.find(
      (b: { user_id: string; net_amount: number }) => b.user_id === userId,
    );

    return userBalance?.net_amount ?? 0;
  }

  async uploadAvatar(userId: string, file: File): Promise<string> {
    const supabase = await createClient();

    const ext = file.name.split(".").pop() || "jpg";
    const path = `avatars/${userId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("user-assets")
      .upload(path, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      throw new DatabaseError(uploadError.message, uploadError);
    }

    const { data } = supabase.storage.from("user-assets").getPublicUrl(path);

    return data.publicUrl;
  }
}
