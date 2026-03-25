"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";

function Spinner() {
  return (
    <svg
      className="animate-spin h-5 w-5"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="auth-btn-primary" disabled={pending}>
      {pending ? <Spinner /> : "Create account"}
    </button>
  );
}

interface RegisterViewProps {
  onRegister: (formData: FormData) => Promise<void>;
  error?: string;
}

export function RegisterView({ onRegister, error }: RegisterViewProps) {
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setFormError(null);
    try {
      await onRegister(formData);
    } catch (err) {
      if (err instanceof Error) {
        setFormError(err.message);
      }
    }
  };

  const displayError = error || formError;

  return (
    <div className="auth-card">
      <h1 className="text-2xl font-semibold text-ink mb-2">Create an account</h1>
      <p className="text-ink-muted text-sm mb-7">
        Start splitting expenses with friends
      </p>

      {displayError && (
        <div className="banner-error mb-6">{displayError}</div>
      )}

      <form action={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="fullName" className="auth-label">
            Full name
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            required
            className="auth-input"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label htmlFor="email" className="auth-label">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="auth-input"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="auth-label">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            className="auth-input"
            placeholder="At least 8 characters"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="auth-label">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            className="auth-input"
            placeholder="Re-enter your password"
          />
        </div>

        <div className="pt-2">
          <SubmitButton />
        </div>
      </form>

      <p className="text-center text-ink-muted text-sm mt-6">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-brand hover:text-brand-glow transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
