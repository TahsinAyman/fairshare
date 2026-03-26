"use client";

import { useState } from "react";
import Link from "next/link";
import type { Group } from "../group.entity";
import type { MemberWithDetails } from "../group.repository.interface";
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

function CopyIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
      />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 19l-7-7m0 0l7-7m-7 7h18"
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

export interface GroupDetailViewProps {
  group: Group;
  members: MemberWithDetails[];
  currentUserId: string;
  isCreator: boolean;
  inviteUrl: string;
  onDeleteGroup: () => Promise<ActionResult>;
  onLeaveGroup: () => Promise<ActionResult>;
  onRegenerateToken: () => Promise<ActionResult<{ url: string }>>;
}

export function GroupDetailView({
  group,
  members,
  currentUserId,
  isCreator,
  inviteUrl,
  onDeleteGroup,
  onLeaveGroup,
  onRegenerateToken,
}: GroupDetailViewProps) {
  const [currentInviteUrl, setCurrentInviteUrl] = useState(inviteUrl);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [regenerateError, setRegenerateError] = useState<string | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentInviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement("input");
      input.value = currentInviteUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    setRegenerateError(null);

    const result = await onRegenerateToken();

    setRegenerating(false);

    if (!result.success) {
      setRegenerateError(result.error);
    } else {
      setCurrentInviteUrl(result.data.url);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    setDeleteError(null);

    const result = await onDeleteGroup();

    setDeleteLoading(false);

    if (!result.success) {
      setDeleteError(result.error);
    }
  };

  const handleLeave = async () => {
    setLeaveLoading(true);
    setLeaveError(null);

    const result = await onLeaveGroup();

    setLeaveLoading(false);

    if (!result.success) {
      setLeaveError(result.error);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back link */}
      <Link
        href="/groups"
        className="inline-flex items-center gap-2 text-ink-muted text-sm hover:text-ink transition-colors mb-6"
      >
        <ArrowLeftIcon />
        <span>Back to groups</span>
      </Link>

      {/* Group header */}
      <div className="bg-surface-raised border border-surface-border rounded-xl p-6 shadow-card mb-6">
        <div className="flex items-start gap-5">
          {group.photo_url ? (
            <img
              src={group.photo_url}
              alt={group.name}
              className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-surface-hover flex items-center justify-center text-ink-muted text-xl font-medium flex-shrink-0">
              {getInitials(group.name)}
            </div>
          )}

          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-ink">
                  {group.name}
                </h1>
                {group.description && (
                  <p className="text-ink-muted text-sm mt-1">
                    {group.description}
                  </p>
                )}
                <p className="text-ink-faint text-sm mt-2">
                  {members.length} {members.length === 1 ? "member" : "members"}
                </p>
              </div>

              {isCreator && (
                <Link
                  href={`/groups/${group.id}/edit`}
                  className="flex items-center gap-2 px-3 py-1.5 text-ink-muted text-sm hover:text-ink hover:bg-surface-hover rounded-lg transition-all"
                >
                  <PencilIcon />
                  <span>Edit</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Members section */}
      <div className="bg-surface-raised border border-surface-border rounded-xl p-6 shadow-card mb-6">
        <h2 className="text-lg font-medium text-ink mb-4">Members</h2>

        <div className="space-y-3">
          {members.map((member) => (
            <div key={member.user_id} className="flex items-center gap-3">
              {member.avatar_url ? (
                <img
                  src={member.avatar_url}
                  alt={member.full_name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center text-ink-muted text-sm font-medium">
                  {getInitials(member.full_name)}
                </div>
              )}

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-ink text-sm font-medium">
                    {member.full_name}
                  </span>
                  {member.user_id === currentUserId && (
                    <span className="text-ink-faint text-xs">(you)</span>
                  )}
                  {member.user_id === group.created_by && (
                    <span className="text-[11px] px-2 py-0.5 bg-brand/10 text-brand border border-brand/20 rounded-full">
                      Creator
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invite section */}
      <div className="bg-surface-raised border border-surface-border rounded-xl p-6 shadow-card mb-6">
        <h2 className="text-lg font-medium text-ink mb-4">Invite link</h2>

        <p className="text-ink-muted text-sm mb-4">
          Share this link to invite others to join this group.
        </p>

        {regenerateError && (
          <div className="banner-error mb-4">{regenerateError}</div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={currentInviteUrl}
            readOnly
            className="auth-input flex-1 font-mono text-sm"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-2 bg-surface-hover border border-surface-border rounded-[10px] text-ink hover:bg-surface-border active:scale-[0.98] transition-all"
            title="Copy link"
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </button>
        </div>

        {copied && (
          <p className="text-brand text-xs mt-2">Copied to clipboard!</p>
        )}

        {isCreator && (
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={regenerating}
            className="flex items-center gap-2 mt-4 text-ink-muted text-sm hover:text-ink transition-colors disabled:opacity-40"
          >
            <RefreshIcon />
            <span>
              {regenerating ? "Regenerating..." : "Generate new link"}
            </span>
          </button>
        )}
      </div>

      {/* Expenses placeholder */}
      <div className="bg-surface-raised border border-surface-border rounded-xl p-6 shadow-card mb-6">
        <h2 className="text-lg font-medium text-ink mb-2">Expenses</h2>
        <p className="text-ink-muted text-sm">Expenses coming soon.</p>
      </div>

      {/* Actions */}
      {isCreator ? (
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
          <h2 className="text-lg font-medium text-red-400 mb-2">Danger zone</h2>
          <p className="text-ink-muted text-sm mb-4">
            Permanently delete this group and all its data.
          </p>

          {deleteError && (
            <div className="banner-error mb-4">{deleteError}</div>
          )}

          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-[10px] text-red-400 text-sm font-medium hover:bg-red-500/20 active:scale-[0.98] transition-all"
            >
              Delete group
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteLoading}
                className="px-4 py-2 bg-red-500 rounded-[10px] text-white text-sm font-medium hover:bg-red-600 active:scale-[0.98] transition-all disabled:opacity-40"
              >
                {deleteLoading ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  "Yes, delete permanently"
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteError(null);
                }}
                disabled={deleteLoading}
                className="px-4 py-2 bg-surface-hover border border-surface-border rounded-[10px] text-ink text-sm font-medium hover:bg-surface-border active:scale-[0.98] transition-all"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-surface-raised border border-surface-border rounded-xl p-6 shadow-card">
          <h2 className="text-lg font-medium text-ink mb-2">Leave group</h2>
          <p className="text-ink-muted text-sm mb-4">
            You will no longer be a member of this group.
          </p>

          {leaveError && <div className="banner-error mb-4">{leaveError}</div>}

          {!showLeaveConfirm ? (
            <button
              type="button"
              onClick={() => setShowLeaveConfirm(true)}
              className="px-4 py-2 bg-surface-hover border border-surface-border rounded-[10px] text-ink text-sm font-medium hover:bg-surface-border active:scale-[0.98] transition-all"
            >
              Leave group
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleLeave}
                disabled={leaveLoading}
                className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-[10px] text-red-400 text-sm font-medium hover:bg-red-500/20 active:scale-[0.98] transition-all disabled:opacity-40"
              >
                {leaveLoading ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  "Yes, leave group"
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLeaveConfirm(false);
                  setLeaveError(null);
                }}
                disabled={leaveLoading}
                className="px-4 py-2 bg-surface-hover border border-surface-border rounded-[10px] text-ink text-sm font-medium hover:bg-surface-border active:scale-[0.98] transition-all"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
