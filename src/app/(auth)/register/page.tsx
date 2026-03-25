import { redirect } from "next/navigation";
import { RegisterView } from "./register.view";
import { AuthRepository } from "../auth.repository";
import * as registerService from "./register.service";
import { safeAction } from "@/lib/utils/errors";

interface RegisterPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function RegisterPage({
  searchParams,
}: RegisterPageProps) {
  const params = await searchParams;

  async function registerAction(formData: FormData) {
    "use server";

    const repo = new AuthRepository();
    const fullName = formData.get("fullName") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    const result = await safeAction(async () => {
      return registerService.register(
        repo,
        fullName,
        email,
        password,
        confirmPassword
      );
    });

    if (!result.success) {
      redirect(`/register?error=${encodeURIComponent(result.error)}`);
    }

    // If user exists but no session (email confirmation required)
    if (result.data.user && !result.data.session) {
      redirect("/register/verify-email");
    }

    // If session exists (auto-confirmed), go to dashboard
    redirect("/dashboard");
  }

  return <RegisterView onRegister={registerAction} error={params.error} />;
}
