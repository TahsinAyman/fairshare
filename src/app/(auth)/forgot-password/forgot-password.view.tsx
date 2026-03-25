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

function CheckIcon() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-brand"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M8 12L11 15L16 9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="auth-btn-primary" disabled={pending}>
      {pending ? <Spinner /> : "Send reset link"}
    </button>
  );
}

interface ForgotPasswordViewProps {
  onSendReset: (formData: FormData) => Promise<{ sent: boolean }>;
  error?: string;
}

export function ForgotPasswordView({
  onSendReset,
  error,
}: ForgotPasswordViewProps) {
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setFormError(null);
    try {
      const result = await onSendReset(formData);
      if (result.sent) {
        setSent(true);
      }
    } catch (err) {
      if (err instanceof Error) {
        setFormError(err.message);
      }
    }
  };

  const displayError = error || formError;

  if (sent) {
    return (
      <div className="auth-card text-center">
        <div className="flex justify-center mb-6">
          <CheckIcon />
        </div>

        <h1 className="text-2xl font-semibold text-ink mb-2">Check your email</h1>
        <p className="text-ink-muted text-sm mb-6">
          If an account exists with that email, we&apos;ve sent you a password
          reset link.
        </p>

        <Link
          href="/login"
          className="text-brand hover:text-brand-glow transition-colors text-sm font-medium"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <h1 className="text-2xl font-semibold text-ink mb-2">Reset your password</h1>
      <p className="text-ink-muted text-sm mb-7">
        Enter your email and we&apos;ll send you a reset link
      </p>

      {displayError && (
        <div className="banner-error mb-6">{displayError}</div>
      )}

      <form action={handleSubmit} className="space-y-4">
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

        <div className="pt-2">
          <SubmitButton />
        </div>
      </form>

      <p className="text-center text-ink-muted text-sm mt-6">
        Remember your password?{" "}
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
