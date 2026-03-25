import Link from "next/link";

function EnvelopeIcon() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-brand"
    >
      <rect
        x="2"
        y="4"
        width="20"
        height="16"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M2 7L10.1649 12.7154C11.2491 13.4283 12.7509 13.4283 13.8351 12.7154L22 7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="auth-card text-center">
      <div className="flex justify-center mb-6">
        <EnvelopeIcon />
      </div>

      <h1 className="text-2xl font-semibold text-ink mb-2">Check your email</h1>
      <p className="text-ink-muted text-sm mb-6">
        We&apos;ve sent you a confirmation link. Please check your inbox and
        click the link to verify your account.
      </p>

      <p className="text-ink-faint text-sm mb-6">
        Didn&apos;t receive the email? Check your spam folder or try signing up
        again.
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
