"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import type { GroupWithMemberCount } from "./group.repository.interface";
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

function CreateButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="px-5 py-2 bg-brand text-surface font-medium text-sm rounded-[10px] hover:bg-brand-glow active:scale-[0.98] transition-all shadow-brand disabled:opacity-40"
      disabled={pending}
    >
      {pending ? <Spinner className="h-4 w-4" /> : "Create group"}
    </button>
  );
}

function PlusIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4v16m8-8H4"
      />
    </svg>
  );
}

function UsersIcon() {
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
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
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

interface GroupCardProps {
  group: GroupWithMemberCount;
}

function GroupCard({ group }: GroupCardProps) {
  return (
    <Link
      href={`/groups/${group.id}`}
      className="block bg-surface-raised border border-surface-border rounded-xl p-5 shadow-card hover:border-surface-hover hover:-translate-y-0.5 transition-all"
    >
      <div className="flex items-start gap-4">
        {group.photo_url ? (
          <img
            src={group.photo_url}
            alt={group.name}
            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-surface-hover flex items-center justify-center text-ink-muted text-sm font-medium flex-shrink-0">
            {getInitials(group.name)}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="text-ink font-medium truncate">{group.name}</h3>
          {group.description && (
            <p className="text-ink-muted text-sm mt-0.5 truncate">
              {group.description}
            </p>
          )}
          <div className="flex items-center gap-1.5 text-ink-faint text-xs mt-2">
            <UsersIcon />
            <span>
              {group.member_count}{" "}
              {group.member_count === 1 ? "member" : "members"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export interface GroupsViewProps {
  groups: GroupWithMemberCount[];
  onCreateGroup: (formData: FormData) => Promise<ActionResult>;
}

export function GroupsView({ groups, onCreateGroup }: GroupsViewProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setCreateError(null);
    const result = await onCreateGroup(formData);

    if (!result.success) {
      setCreateError(result.error);
    } else {
      setShowCreateForm(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Your groups</h1>
          <p className="text-ink-muted text-sm mt-1">
            Manage your expense groups
          </p>
        </div>

        {groups.length > 0 && !showCreateForm && (
          <button
            type="button"
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand text-surface font-medium text-sm rounded-[10px] hover:bg-brand-glow active:scale-[0.98] transition-all shadow-brand"
          >
            <PlusIcon />
            <span>New group</span>
          </button>
        )}
      </div>

      {/* Create form - inline expansion */}
      {showCreateForm && (
        <div className="bg-surface-raised border border-surface-border rounded-xl p-6 shadow-card mb-6">
          <h2 className="text-lg font-medium text-ink mb-4">
            Create a new group
          </h2>

          {createError && (
            <div className="banner-error mb-4">{createError}</div>
          )}

          <form action={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="auth-label">
                Group name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                maxLength={50}
                className="auth-input"
                placeholder="e.g., Roommates, Trip to Paris"
              />
            </div>

            <div>
              <label htmlFor="description" className="auth-label">
                Description (optional)
              </label>
              <textarea
                id="description"
                name="description"
                rows={2}
                className="auth-input resize-none"
                placeholder="What's this group for?"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <CreateButton />
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setCreateError(null);
                }}
                className="px-4 py-2 text-ink-muted text-sm font-medium hover:text-ink transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Empty state */}
      {groups.length === 0 && !showCreateForm && (
        <div className="bg-surface-raised border border-surface-border rounded-xl p-8 shadow-card text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand/10 flex items-center justify-center">
            <UsersIcon />
          </div>
          <h2 className="text-lg font-medium text-ink mb-2">No groups yet</h2>
          <p className="text-ink-muted text-sm mb-6 max-w-sm mx-auto">
            Create your first group to start splitting expenses with friends,
            roommates, or travel companions.
          </p>
          <button
            type="button"
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand text-surface font-medium text-sm rounded-[10px] hover:bg-brand-glow active:scale-[0.98] transition-all shadow-brand"
          >
            <PlusIcon />
            <span>Create your first group</span>
          </button>
        </div>
      )}

      {/* Groups grid */}
      {groups.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      )}
    </div>
  );
}
