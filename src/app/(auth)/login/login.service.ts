import { ValidationError } from "@/lib/utils/errors";
import type { IAuthRepository } from "../auth.repository.interface";

function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError("Please enter a valid email address.");
  }
}

function validatePassword(password: string): void {
  if (password.length < 6) {
    throw new ValidationError("Password must be at least 6 characters.");
  }
}

export async function loginWithPassword(
  repo: IAuthRepository,
  email: string,
  password: string
) {
  validateEmail(email);
  validatePassword(password);

  return repo.signInWithPassword(email, password);
}

export async function initiateOAuthLogin(
  repo: IAuthRepository,
  provider: "google",
  redirectTo: string
) {
  const result = await repo.signInWithOAuth(provider, redirectTo);

  if (!result.url) {
    throw new ValidationError("Failed to initiate OAuth login.");
  }

  return result.url;
}
