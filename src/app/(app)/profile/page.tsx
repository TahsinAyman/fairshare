import { redirect } from "next/navigation";
import { ProfileView } from "./profile.view";
import { ProfileRepository } from "./profile.repository";
import { AuthRepository } from "@/app/(auth)/auth.repository";
import * as profileService from "./profile.service";
import { safeAction, type ActionResult } from "@/lib/utils/errors";

export default async function ProfilePage() {
  // Get auth user
  const authRepo = new AuthRepository();
  const authUser = await authRepo.getSession();

  if (!authUser) {
    redirect("/login");
  }

  // Get profile
  const profileRepo = new ProfileRepository();
  const profileResult = await safeAction(async () => {
    return profileService.getProfile(profileRepo, authUser.id);
  });

  if (!profileResult.success) {
    redirect("/login");
  }

  const user = profileResult.data;

  async function updateProfileAction(
    formData: FormData,
  ): Promise<ActionResult> {
    "use server";

    const repo = new ProfileRepository();
    const authRepo = new AuthRepository();
    const currentUser = await authRepo.getSession();

    if (!currentUser) {
      return { success: false, error: "You must be logged in." };
    }

    const fullName = formData.get("fullName") as string;
    const phone = formData.get("phone") as string;
    const dateOfBirth = formData.get("dateOfBirth") as string;
    const address = formData.get("address") as string;

    const result = await safeAction(async () => {
      await profileService.updateProfile(repo, currentUser.id, {
        full_name: fullName,
        phone_number: phone || null,
        date_of_birth: dateOfBirth || null,
        address: address || null,
      });
    });

    return result;
  }

  async function uploadAvatarAction(
    formData: FormData,
  ): Promise<ActionResult & { avatarUrl?: string }> {
    "use server";

    const repo = new ProfileRepository();
    const authRepo = new AuthRepository();
    const currentUser = await authRepo.getSession();

    if (!currentUser) {
      return { success: false, error: "You must be logged in." };
    }

    const file = formData.get("avatar") as File;

    if (!file || !(file instanceof File)) {
      return { success: false, error: "No file provided." };
    }

    const result = await safeAction(async () => {
      return profileService.uploadAvatar(repo, currentUser.id, file);
    });

    if (!result.success) {
      return result;
    }

    return { success: true, data: undefined, avatarUrl: result.data.publicUrl };
  }

  async function deleteAccountAction(): Promise<ActionResult> {
    "use server";

    const repo = new ProfileRepository();
    const authRepo = new AuthRepository();
    const currentUser = await authRepo.getSession();

    if (!currentUser) {
      return { success: false, error: "You must be logged in." };
    }

    const result = await safeAction(async () => {
      await profileService.requestAccountDeletion(repo, currentUser.id);
    });

    if (!result.success) {
      return result;
    }

    redirect("/login?message=account_deleted");
  }

  return (
    <ProfileView
      user={user}
      onUpdateProfile={updateProfileAction}
      onUploadAvatar={uploadAvatarAction}
      onDeleteAccount={deleteAccountAction}
    />
  );
}
