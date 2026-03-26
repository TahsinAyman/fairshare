"use client";

import { useState, useRef, type FormEvent, type ChangeEvent } from "react";
import Link from "next/link";
import type { Group } from "../../group.entity";
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

function CameraIcon() {
  return (
    <svg
      className="w-6 h-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
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

export interface EditGroupViewProps {
  group: Group;
  onUpdate: (formData: FormData) => Promise<ActionResult>;
  onUploadPhoto: (formData: FormData) => Promise<ActionResult<{ url: string }>>;
}

export function EditGroupView({
  group,
  onUpdate,
  onUploadPhoto,
}: EditGroupViewProps) {
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description || "");
  const [photoUrl, setPhotoUrl] = useState(group.photo_url);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);

    const result = await onUpdate(formData);

    setLoading(false);

    if (!result.success) {
      setError(result.error);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoLoading(true);
    setPhotoError(null);

    const formData = new FormData();
    formData.append("photo", file);

    const result = await onUploadPhoto(formData);

    setPhotoLoading(false);

    if (!result.success) {
      setPhotoError(result.error);
    } else {
      setPhotoUrl(result.data.url);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      {/* Back link */}
      <Link
        href={`/groups/${group.id}`}
        className="inline-flex items-center gap-2 text-ink-muted text-sm hover:text-ink transition-colors mb-6"
      >
        <ArrowLeftIcon />
        <span>Back to group</span>
      </Link>

      <h1 className="text-2xl font-semibold text-ink mb-6">Edit group</h1>

      {/* Photo upload */}
      <div className="bg-surface-raised border border-surface-border rounded-xl p-6 shadow-card mb-6">
        <h2 className="text-lg font-medium text-ink mb-4">Group photo</h2>

        {photoError && <div className="banner-error mb-4">{photoError}</div>}

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handlePhotoClick}
            disabled={photoLoading}
            className="relative w-20 h-20 rounded-xl overflow-hidden group focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-surface disabled:opacity-50"
          >
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-surface-hover flex items-center justify-center text-ink-muted text-xl font-medium">
                {getInitials(name)}
              </div>
            )}

            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {photoLoading ? (
                <Spinner className="h-6 w-6 text-white" />
              ) : (
                <CameraIcon />
              )}
            </div>
          </button>

          <div className="text-sm text-ink-muted">
            <p>Click to upload a new photo</p>
            <p className="text-xs text-ink-faint mt-1">
              JPG, PNG, or WebP. Max 5MB.
            </p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handlePhotoChange}
          className="hidden"
        />
      </div>

      {/* Group details form */}
      <div className="bg-surface-raised border border-surface-border rounded-xl p-6 shadow-card">
        <h2 className="text-lg font-medium text-ink mb-4">Group details</h2>

        {error && <div className="banner-error mb-4">{error}</div>}

        {success && (
          <div className="banner-success mb-4">Changes saved successfully!</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-ink-muted mb-1.5"
            >
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={50}
              className="auth-input w-full"
              placeholder="e.g. Roommates"
            />
            <p className="text-xs text-ink-faint mt-1">
              {name.length}/50 characters
            </p>
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-ink-muted mb-1.5"
            >
              Description
              <span className="text-ink-faint font-normal ml-1">
                (optional)
              </span>
            </label>
            <textarea
              id="description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="auth-input w-full resize-none"
              placeholder="What is this group for?"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="auth-button w-full flex items-center justify-center"
          >
            {loading ? <Spinner /> : "Save changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
