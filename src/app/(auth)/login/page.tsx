import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { LoginView } from "./login.view";
import { AuthRepository } from "../auth.repository";
import * as loginService from "./login.service";
import { safeAction } from "@/lib/utils/errors";

interface LoginPageProps {
  searchParams: Promise<{ redirectTo?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const redirectTo = params.redirectTo || "/dashboard";

  async function emailLoginAction(formData: FormData) {
    "use server";

    const repo = new AuthRepository();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const result = await safeAction(async () => {
      await loginService.loginWithPassword(repo, email, password);
    });

    if (!result.success) {
      redirect(
        `/login?error=${encodeURIComponent(result.error)}&redirectTo=${encodeURIComponent(redirectTo)}`
      );
    }

    redirect(redirectTo);
  }

  async function googleLoginAction() {
    "use server";

    const repo = new AuthRepository();
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3000";
    const protocol = headersList.get("x-forwarded-proto") || "http";
    const origin = `${protocol}://${host}`;
    const callbackUrl = `${origin}/auth/callback`;

    const result = await safeAction(async () => {
      const url = await loginService.initiateOAuthLogin(
        repo,
        "google",
        callbackUrl
      );
      return { url };
    });

    if (!result.success) {
      return { url: `/login?error=${encodeURIComponent(result.error)}` };
    }

    return result.data;
  }

  return (
    <LoginView
      onEmailLogin={emailLoginAction}
      onGoogleLogin={googleLoginAction}
      error={params.error}
    />
  );
}
