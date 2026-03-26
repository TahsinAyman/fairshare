import { createClient } from "@/lib/supabase/server";
import { DatabaseError } from "@/lib/utils/errors";
import { nanoid } from "nanoid";
import type {
  Group,
  GroupInsert,
  GroupUpdate,
  GroupMember,
} from "./group.entity";
import type {
  IGroupRepository,
  GroupWithMemberCount,
  MemberWithDetails,
} from "./group.repository.interface";

export class GroupRepository implements IGroupRepository {
  async getGroupsForUser(userId: string): Promise<GroupWithMemberCount[]> {
    const supabase = await createClient();

    // Get groups the user is a member of
    const { data: memberships, error: membershipError } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", userId);

    if (membershipError) {
      throw new DatabaseError(membershipError.message, membershipError);
    }

    if (!memberships || memberships.length === 0) {
      return [];
    }

    const groupIds = memberships.map((m) => m.group_id);

    // Get groups with member counts
    const { data: groups, error: groupsError } = await supabase
      .from("groups")
      .select("*")
      .in("id", groupIds)
      .order("created_at", { ascending: false });

    if (groupsError) {
      throw new DatabaseError(groupsError.message, groupsError);
    }

    // Get member counts for each group
    const groupsWithCounts: GroupWithMemberCount[] = [];

    for (const group of groups || []) {
      const { count, error: countError } = await supabase
        .from("group_members")
        .select("*", { count: "exact", head: true })
        .eq("group_id", group.id);

      if (countError) {
        throw new DatabaseError(countError.message, countError);
      }

      groupsWithCounts.push({
        ...(group as Group),
        member_count: count || 0,
      });
    }

    return groupsWithCounts;
  }

  async getGroupById(groupId: string): Promise<Group | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("groups")
      .select("*")
      .eq("id", groupId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new DatabaseError(error.message, error);
    }

    return data as Group;
  }

  async getGroupByInviteToken(token: string): Promise<Group | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("groups")
      .select("*")
      .eq("invite_token", token)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new DatabaseError(error.message, error);
    }

    return data as Group;
  }

  async createGroup(data: Omit<GroupInsert, "invite_token">): Promise<Group> {
    const supabase = await createClient();

    const inviteToken = nanoid(12);

    const { data: group, error } = await supabase
      .from("groups")
      .insert({
        ...data,
        invite_token: inviteToken,
      })
      .select()
      .single();

    if (error) {
      throw new DatabaseError(error.message, error);
    }

    return group as Group;
  }

  async updateGroup(groupId: string, updates: GroupUpdate): Promise<Group> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("groups")
      .update(updates)
      .eq("id", groupId)
      .select()
      .single();

    if (error) {
      throw new DatabaseError(error.message, error);
    }

    return data as Group;
  }

  async deleteGroup(groupId: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase.from("groups").delete().eq("id", groupId);

    if (error) {
      throw new DatabaseError(error.message, error);
    }
  }

  async uploadGroupPhoto(groupId: string, file: File): Promise<string> {
    const supabase = await createClient();

    const ext = file.name.split(".").pop() || "jpg";
    const path = `group-photos/${groupId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("group-assets")
      .upload(path, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      throw new DatabaseError(uploadError.message, uploadError);
    }

    const { data } = supabase.storage.from("group-assets").getPublicUrl(path);

    return data.publicUrl;
  }

  async addMember(groupId: string, userId: string): Promise<GroupMember> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("group_members")
      .insert({ group_id: groupId, user_id: userId })
      .select()
      .single();

    if (error) {
      throw new DatabaseError(error.message, error);
    }

    return data as GroupMember;
  }

  async removeMember(groupId: string, userId: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", userId);

    if (error) {
      throw new DatabaseError(error.message, error);
    }
  }

  async isMember(groupId: string, userId: string): Promise<boolean> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("group_members")
      .select("user_id")
      .eq("group_id", groupId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw new DatabaseError(error.message, error);
    }

    return data !== null;
  }

  async getMembersWithDetails(groupId: string): Promise<MemberWithDetails[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("group_members")
      .select(
        `
        user_id,
        joined_at,
        users!inner (
          full_name,
          avatar_url
        )
      `,
      )
      .eq("group_id", groupId)
      .order("joined_at", { ascending: true });

    if (error) {
      throw new DatabaseError(error.message, error);
    }

    return (data || []).map((row) => {
      const users = row.users as unknown as {
        full_name: string;
        avatar_url: string | null;
      };
      return {
        user_id: row.user_id as string,
        full_name: users.full_name,
        avatar_url: users.avatar_url,
        joined_at: row.joined_at as string,
      };
    });
  }

  async getMemberCount(groupId: string): Promise<number> {
    const supabase = await createClient();

    const { count, error } = await supabase
      .from("group_members")
      .select("*", { count: "exact", head: true })
      .eq("group_id", groupId);

    if (error) {
      throw new DatabaseError(error.message, error);
    }

    return count || 0;
  }

  async regenerateInviteToken(groupId: string): Promise<string> {
    const supabase = await createClient();

    const newToken = nanoid(12);

    const { error } = await supabase
      .from("groups")
      .update({ invite_token: newToken })
      .eq("id", groupId);

    if (error) {
      throw new DatabaseError(error.message, error);
    }

    return newToken;
  }

  async getGroupNetBalances(
    groupId: string,
  ): Promise<Array<{ user_id: string; net_amount: number }>> {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("get_group_balances", {
      p_group_id: groupId,
    });

    if (error) {
      throw new DatabaseError(error.message, error);
    }

    return (data || []).map((row: { user_id: string; net_amount: number }) => ({
      user_id: row.user_id,
      net_amount: row.net_amount,
    }));
  }
}
