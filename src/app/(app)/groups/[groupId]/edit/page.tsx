import { redirect } from "next/navigation";
import { EditGroupView } from "./edit-group.view";
import { GroupRepository } from "../../group.repository";
import * as groupService from "../../group.service";
import { safeAction, type ActionResult } from "@/lib/utils/errors";

interface EditGroupPageProps {
  params: Promise<{ groupId: string }>;
}

export default async function EditGroupPage({ params }: EditGroupPageProps) {
  const { groupId } = await params;
  const repo = new GroupRepository();

  const detailsResult = await safeAction(async () => {
    return groupService.getGroupDetails(repo, groupId);
  });

  if (!detailsResult.success) {
    redirect("/groups");
  }

  const { group } = detailsResult.data;

  // Verify user is the creator
  const currentUserResult = await safeAction(async () => {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id;
  });

  if (!currentUserResult.success || !currentUserResult.data) {
    redirect("/login");
  }

  if (group.created_by !== currentUserResult.data) {
    redirect(`/groups/${groupId}`);
  }

  async function updateGroupAction(formData: FormData): Promise<ActionResult> {
    "use server";

    const repo = new GroupRepository();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    const result = await safeAction(async () => {
      await groupService.updateGroup(repo, groupId, {
        name,
        description: description || null,
      });
    });

    return result;
  }

  async function uploadPhotoAction(formData: FormData): Promise<ActionResult<{ url: string }>> {
    "use server";

    const repo = new GroupRepository();
    const file = formData.get("photo") as File;

    if (!file) {
      return { success: false, error: "No file provided." };
    }

    const result = await safeAction(async () => {
      const updatedGroup = await groupService.uploadGroupPhoto(repo, groupId, file);
      return { url: updatedGroup.photo_url! };
    });

    return result;
  }

  return (
    <EditGroupView
      group={group}
      onUpdate={updateGroupAction}
      onUploadPhoto={uploadPhotoAction}
    />
  );
}
