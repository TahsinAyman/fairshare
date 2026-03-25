"use client";

import { useState, useRef } from "react";
import { useFormStatus } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@/app/(auth)/user.entity";
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

function LockIcon() {
  return (
    <svg
      className="w-4 h-4 text-ink-faint"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="px-5 py-2 bg-brand text-surface font-medium text-sm rounded-[10px] hover:bg-brand-glow active:scale-[0.98] transition-all disabled:opacity-40"
      disabled={pending}
    >
      {pending ? <Spinner className="h-4 w-4" /> : "Save changes"}
    </button>
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

export interface ProfileViewProps {
  user: User;
  userId: string;
  onUpdateProfile: (formData: FormData) => Promise<ActionResult>;
  onSaveAvatarUrl: (url: string) => Promise<ActionResult>;
  onDeleteAccount: () => Promise<ActionResult>;
}

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB

export function ProfileView({
  user,
  userId,
  onUpdateProfile,
  onSaveAvatarUrl,
  onDeleteAccount,
}: ProfileViewProps) {
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(user.avatar_url);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAvatarError(null);

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setAvatarError("Avatar must be a JPG, PNG, or WebP image.");
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setAvatarError("Avatar must be smaller than 3MB.");
      return;
    }

    setAvatarUploading(true);

    try {
      // Upload client-side to Supabase Storage
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "jpg";
      const path = `avatars/${userId}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("user-assets")
        .upload(path, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) {
        setAvatarError(uploadError.message);
        setAvatarUploading(false);
        return;
      }

      // Get public URL
      const { data } = supabase.storage.from("user-assets").getPublicUrl(path);
      const publicUrl = data.publicUrl;

      // Save URL via server action
      const result = await onSaveAvatarUrl(publicUrl);

      if (!result.success) {
        setAvatarError(result.error);
      } else {
        // Update local state with cache-busting
        setCurrentAvatarUrl(`${publicUrl}?t=${Date.now()}`);
      }
    } catch {
      setAvatarError("Failed to upload avatar.");
    } finally {
      setAvatarUploading(false);
      // Reset the input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleProfileSubmit = async (formData: FormData) => {
    setProfileSuccess(false);
    setProfileError(null);

    const result = await onUpdateProfile(formData);

    if (result.success) {
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } else {
      setProfileError(result.error);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
    setDeleteError(null);
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    setDeleteError(null);

    const result = await onDeleteAccount();

    setDeleteLoading(false);

    if (!result.success) {
      setDeleteError(result.error);
    }
    // If successful, the page will redirect
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setDeleteError(null);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Profile</h1>
        <p className="text-ink-muted text-sm mt-1">
          Manage your account settings
        </p>
      </div>

      {/* Photo section */}
      <div className="bg-surface-raised border border-surface-border rounded-xl p-8 shadow-card">
        <h2 className="text-lg font-medium text-ink mb-6">Profile photo</h2>

        <div className="flex items-center gap-6">
          <div className="relative">
            {currentAvatarUrl ? (
              <img
                src={currentAvatarUrl}
                alt={user.full_name}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-surface-hover flex items-center justify-center text-ink-muted text-xl font-medium">
                {getInitials(user.full_name)}
              </div>
            )}
            {avatarUploading && (
              <div className="absolute inset-0 bg-surface/60 rounded-full flex items-center justify-center">
                <Spinner className="h-6 w-6 text-brand" />
              </div>
            )}
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              className="px-4 py-2 bg-surface-hover border border-surface-border rounded-[10px] text-ink text-sm font-medium hover:bg-surface-border active:scale-[0.98] transition-all disabled:opacity-40"
            >
              {avatarUploading ? "Uploading..." : "Change photo"}
            </button>
            <p className="text-ink-faint text-xs mt-2">
              JPG, PNG, or WebP. Max 3MB.
            </p>
            {avatarError && (
              <p className="text-red-400 text-xs mt-2">{avatarError}</p>
            )}
          </div>
        </div>
      </div>

      {/* Personal info section */}
      <div className="bg-surface-raised border border-surface-border rounded-xl p-8 shadow-card">
        <h2 className="text-lg font-medium text-ink mb-6">
          Personal information
        </h2>

        {profileSuccess && (
          <div className="banner-success mb-6">
            Profile updated successfully.
          </div>
        )}
        {profileError && (
          <div className="banner-error mb-6">{profileError}</div>
        )}

        <form action={handleProfileSubmit} className="space-y-5">
          <div>
            <label className="auth-label">Email</label>
            <div className="flex items-center gap-2 text-ink text-sm py-2">
              <span>{user.email}</span>
              <LockIcon />
            </div>
          </div>

          <div>
            <label htmlFor="fullName" className="auth-label">
              Full name
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              defaultValue={user.full_name}
              className="auth-input"
            />
          </div>

          <div>
            <label htmlFor="phone" className="auth-label">
              Phone number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={user.phone_number || ""}
              className="auth-input"
              placeholder="01XXXXXXXXX"
            />
          </div>

          <div>
            <label htmlFor="dateOfBirth" className="auth-label">
              Date of birth
            </label>
            <input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              defaultValue={user.date_of_birth || ""}
              className="auth-input"
            />
          </div>

          <div>
            <label htmlFor="address" className="auth-label">
              Address
            </label>
            <textarea
              id="address"
              name="address"
              rows={3}
              defaultValue={user.address || ""}
              className="auth-input resize-none"
              placeholder="Enter your address"
            />
          </div>

          <div className="flex justify-end pt-2">
            <SaveButton />
          </div>
        </form>
      </div>

      {/* Danger zone */}
      <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-8">
        <h2 className="text-lg font-medium text-red-400 mb-2">Danger zone</h2>
        <p className="text-ink-muted text-sm mb-6">
          Once you delete your account, there is no going back. Please be
          certain.
        </p>

        {deleteError && <div className="banner-error mb-4">{deleteError}</div>}

        {!showDeleteConfirm ? (
          <button
            type="button"
            onClick={handleDeleteClick}
            className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-[10px] text-red-400 text-sm font-medium hover:bg-red-500/20 active:scale-[0.98] transition-all"
          >
            Delete account
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDeleteConfirm}
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
              onClick={handleDeleteCancel}
              disabled={deleteLoading}
              className="px-4 py-2 bg-surface-hover border border-surface-border rounded-[10px] text-ink text-sm font-medium hover:bg-surface-border active:scale-[0.98] transition-all"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
