import { ValidationError } from "@/lib/utils/errors";
import type { IAuthRepository } from "../auth.repository.interface";

function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError("Please enter a valid email address.");
  }
}

export async function sendReset(
  repo: IAuthRepository,
  email: string,
  redirectTo: string
) {
  validateEmail(email);

  await repo.sendPasswordResetEmail(email, redirectTo);
}
