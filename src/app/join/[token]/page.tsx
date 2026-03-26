import { redirect } from "next/navigation";
import { JoinView, InvalidTokenView } from "./join.view";
import { GroupRepository } from "@/app/(app)/groups/group.repository";
import * as groupService from "@/app/(app)/groups/group.service";
import { safeAction, type ActionResult } from "@/lib/utils/errors";
import { createClient } from "@/lib/supabase/server";

interface JoinPageProps {
  params: Promise<{ token: string }>;
}

export default async function JoinPage({ params }: JoinPageProps) {
  const { token } = await params;
  const repo = new GroupRepository();

  // Check if user is logged in
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Redirect to login with return URL
    redirect(`/login?returnTo=/join/${token}`);
  }

  // Get group info by token
  const groupResult = await safeAction(async () => {
    return groupService.getGroupByToken(repo, token);
  });

  if (!groupResult.success || !groupResult.data) {
    return <InvalidTokenView />;
  }

  const { group, memberCount } = groupResult.data;

  // Check if already a member
  const isMemberResult = await safeAction(async () => {
    return repo.isMember(group.id, user.id);
  });

  if (isMemberResult.success && isMemberResult.data) {
    // Already a member, redirect to group
    redirect(`/groups/${group.id}`);
  }

  async function joinAction(): Promise<ActionResult> {
    "use server";

    const repo = new GroupRepository();

    const result = await safeAction(async () => {
      const joinedGroup = await groupService.joinViaToken(repo, token);
      return joinedGroup;
    });

    if (!result.success) {
      return result;
    }

    redirect(`/groups/${result.data.id}`);
  }

  return (
    <JoinView group={group} memberCount={memberCount} onJoin={joinAction} />
  );
}
