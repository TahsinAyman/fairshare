import { redirect } from "next/navigation";
import { GroupDetailView } from "./group-detail.view";
import { GroupRepository } from "../group.repository";
import * as groupService from "../group.service";
import { safeAction, type ActionResult } from "@/lib/utils/errors";

interface GroupDetailPageProps {
  params: Promise<{ groupId: string }>;
}

export default async function GroupDetailPage({ params }: GroupDetailPageProps) {
  const { groupId } = await params;
  const repo = new GroupRepository();

  const detailsResult = await safeAction(async () => {
    return groupService.getGroupDetails(repo, groupId);
  });

  if (!detailsResult.success) {
    redirect("/groups");
  }

  const { group, members } = detailsResult.data;

  const inviteUrlResult = await safeAction(async () => {
    return groupService.getInviteUrl(repo, groupId);
  });

  if (!inviteUrlResult.success) {
    redirect("/groups");
  }

  const inviteUrl = inviteUrlResult.data;

  // Get current user ID
  const currentUserResult = await safeAction(async () => {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id;
  });

  if (!currentUserResult.success || !currentUserResult.data) {
    redirect("/login");
  }

  const currentUserId = currentUserResult.data;
  const isCreator = group.created_by === currentUserId;

  async function deleteGroupAction(): Promise<ActionResult> {
    "use server";

    const repo = new GroupRepository();

    const result = await safeAction(async () => {
      await groupService.deleteGroup(repo, groupId);
    });

    if (!result.success) {
      return result;
    }

    redirect("/groups");
  }

  async function leaveGroupAction(): Promise<ActionResult> {
    "use server";

    const repo = new GroupRepository();

    const result = await safeAction(async () => {
      await groupService.leaveGroup(repo, groupId);
    });

    if (!result.success) {
      return result;
    }

    redirect("/groups");
  }

  async function regenerateTokenAction(): Promise<ActionResult<{ url: string }>> {
    "use server";

    const repo = new GroupRepository();

    const result = await safeAction(async () => {
      const newUrl = await groupService.regenerateInviteToken(repo, groupId);
      return { url: newUrl };
    });

    return result;
  }

  return (
    <GroupDetailView
      group={group}
      members={members}
      currentUserId={currentUserId}
      isCreator={isCreator}
      inviteUrl={inviteUrl}
      onDeleteGroup={deleteGroupAction}
      onLeaveGroup={leaveGroupAction}
      onRegenerateToken={regenerateTokenAction}
    />
  );
}
