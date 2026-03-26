import { redirect } from "next/navigation";
import { GroupsView } from "./groups.view";
import { GroupRepository } from "./group.repository";
import * as groupService from "./group.service";
import { safeAction, type ActionResult } from "@/lib/utils/errors";

export default async function GroupsPage() {
  const repo = new GroupRepository();

  const groupsResult = await safeAction(async () => {
    return groupService.getMyGroups(repo);
  });

  if (!groupsResult.success) {
    redirect("/login");
  }

  const groups = groupsResult.data;

  async function createGroupAction(formData: FormData): Promise<ActionResult> {
    "use server";

    const repo = new GroupRepository();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    const result = await safeAction(async () => {
      const group = await groupService.createGroup(
        repo,
        name,
        description || null
      );
      return group;
    });

    if (!result.success) {
      return result;
    }

    redirect(`/groups/${result.data.id}`);
  }

  return <GroupsView groups={groups} onCreateGroup={createGroupAction} />;
}
