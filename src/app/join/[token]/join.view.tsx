"use client";

import { useState } from "react";
import Link from "next/link";
import type { Group } from "@/app/(app)/groups/group.entity";
import type { ActionResult } from "@/lib/utils/errors";

function Spinner({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
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

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export interface JoinViewProps {
  group: Group;
  memberCount: number;
  onJoin: () => Promise<ActionResult>;
}

export function JoinView({ group, memberCount, onJoin }: JoinViewProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    setLoading(true);
    setError(null);

    const result = await onJoin();

    setLoading(false);

    if (!result.success) {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-surface">
      <div className="w-full max-w-sm">
        <div className="bg-surface-raised border border-surface-border rounded-xl p-8 shadow-card text-center">
          {/* Group photo/initials */}
          {group.photo_url ? (
            <img
              src={group.photo_url}
              alt={group.name}
              className="w-20 h-20 rounded-xl object-cover mx-auto mb-4"
            />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-surface-hover flex items-center justify-center text-ink-muted text-xl font-medium mx-auto mb-4">
              {getInitials(group.name)}
            </div>
          )}

          {/* Group info */}
          <h1 className="text-xl font-semibold text-ink mb-1">{group.name}</h1>

          {group.description && (
            <p className="text-ink-muted text-sm mb-2">{group.description}</p>
          )}

          <p className="text-ink-faint text-sm mb-6">
            {memberCount} {memberCount === 1 ? "member" : "members"}
          </p>

          {/* Invitation message */}
          <p className="text-ink text-sm mb-6">
            You&apos;ve been invited to join this group.
          </p>

          {error && <div className="banner-error mb-4">{error}</div>}

          {/* Join button */}
          <button
            type="button"
            onClick={handleJoin}
            disabled={loading}
            className="auth-button w-full flex items-center justify-center mb-4"
          >
            {loading ? <Spinner /> : "Join group"}
          </button>

          {/* Back link */}
          <Link
            href="/groups"
            className="text-ink-muted text-sm hover:text-ink transition-colors"
          >
            Go to my groups
          </Link>
        </div>
      </div>
    </div>
  );
}

export function InvalidTokenView() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-surface">
      <div className="w-full max-w-sm">
        <div className="bg-surface-raised border border-surface-border rounded-xl p-8 shadow-card text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>

          <h1 className="text-xl font-semibold text-ink mb-2">
            Invalid invite link
          </h1>

          <p className="text-ink-muted text-sm mb-6">
            This invite link is invalid or has expired. Please ask the group
            creator for a new link.
          </p>

          <Link
            href="/groups"
            className="auth-button inline-flex items-center justify-center w-full"
          >
            Go to my groups
          </Link>
        </div>
      </div>
    </div>
  );
}
