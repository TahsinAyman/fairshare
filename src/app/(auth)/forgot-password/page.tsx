import { headers } from "next/headers";
import { ForgotPasswordView } from "./forgot-password.view";
import { AuthRepository } from "../auth.repository";
import * as forgotPasswordService from "./forgot-password.service";
import { safeAction } from "@/lib/utils/errors";

interface ForgotPasswordPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const params = await searchParams;

  async function sendResetAction(
    formData: FormData
  ): Promise<{ sent: boolean }> {
    "use server";

    const repo = new AuthRepository();
    const email = formData.get("email") as string;

    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3000";
    const protocol = headersList.get("x-forwarded-proto") || "http";
    const origin = `${protocol}://${host}`;
    const redirectTo = `${origin}/auth/callback?next=/reset-password`;

    const result = await safeAction(async () => {
      await forgotPasswordService.sendReset(repo, email, redirectTo);
    });

    // Always return sent: true to prevent email enumeration
    if (!result.success) {
      console.error("[ForgotPassword]", result.error);
    }

    return { sent: true };
  }

  return (
    <ForgotPasswordView onSendReset={sendResetAction} error={params.error} />
  );
}
