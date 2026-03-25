import { ValidationError } from "@/lib/utils/errors";
import type { IAuthRepository } from "../auth.repository.interface";

function validateFullName(name: string): void {
  if (name.trim().length < 2) {
    throw new ValidationError("Name must be at least 2 characters.");
  }
}

function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError("Please enter a valid email address.");
  }
}

function validatePassword(password: string): void {
  if (password.length < 8) {
    throw new ValidationError("Password must be at least 8 characters.");
  }
}

function validatePasswordsMatch(
  password: string,
  confirmPassword: string
): void {
  if (password !== confirmPassword) {
    throw new ValidationError("Passwords do not match.");
  }
}

export async function register(
  repo: IAuthRepository,
  fullName: string,
  email: string,
  password: string,
  confirmPassword: string
) {
  validateFullName(fullName);
  validateEmail(email);
  validatePassword(password);
  validatePasswordsMatch(password, confirmPassword);

  return repo.signUpWithPassword(email, password, fullName.trim());
}
