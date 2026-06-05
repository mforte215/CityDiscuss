"use client";

// Suppress search engine indexing for account settings
export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/components/theme-provider";
import { Avatar } from "@/components/avatar";

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isWelcome = searchParams.get("welcome") === "1";
  const { theme, toggle } = useTheme();
  const fileRef = useRef<HTMLInputElement>(null);

  const [userId, setUserId] = useState("");
  const [username, setUsername] = useState("");
  const [current, setCurrent] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [avatarSuccess, setAvatarSuccess] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/auth/login");
        return;
      }
      setUserId(user.id);
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", user.id)
        .single();
      if (profile) {
        setUsername(profile.username);
        setCurrent(profile.username);
        setAvatarUrl(profile.avatar_url ?? null);
      }
      setLoading(false);
    });
  }, [router]);

  async function handleSave() {
    if (!username.trim() || username === current) return;
    setSaving(true);
    setError("");
    setSuccess(false);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username.trim())
      .neq("id", user.id)
      .single();

    if (existing) {
      setError("That username is already taken.");
      setSaving(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ username: username.trim() })
      .eq("id", user.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      setCurrent(username.trim());
      setSuccess(true);
    }
    setSaving(false);
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setUploadingAvatar(true);
    setAvatarSuccess(false);

    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${userId}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setError("Avatar upload failed: " + uploadError.message);
      setUploadingAvatar(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(path);

    // Bust the CDN cache by appending a timestamp
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", userId);

    if (updateError) {
      setError("Failed to save avatar: " + updateError.message);
    } else {
      setAvatarUrl(publicUrl);
      setAvatarSuccess(true);
    }

    setUploadingAvatar(false);
    // Reset file input so the same file can be re-selected later
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleRemoveAvatar() {
    if (!userId) return;
    setUploadingAvatar(true);

    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({ avatar_url: null })
      .eq("id", userId);

    setAvatarUrl(null);
    setAvatarSuccess(false);
    setUploadingAvatar(false);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-sm px-6 py-20 text-sm text-gray-400 dark:text-white/30">
        Loading...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-20">

      {/* Welcome banner — shown after signup */}
      {isWelcome && (
        <div className="mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 px-5 py-4 text-white shadow-[0_0_24px_rgba(59,130,246,0.3)]">
          <p className="text-base font-bold">Welcome to CityDiscuss! 🎉</p>
          <p className="mt-1 text-sm text-blue-100">
            Set a username so the community knows who you are, then jump into a discussion.
          </p>
        </div>
      )}

      {/* No username nudge — shown if profile exists but username is missing */}
      {!isWelcome && !current && !loading && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-500/20 dark:bg-amber-500/[0.06]">
          <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
            You haven't set a username yet
          </p>
          <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-500/80">
            Choose one below to start posting and commenting.
          </p>
        </div>
      )}

      <h1 className="mb-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
        Settings
      </h1>
      <p className="mb-8 text-sm text-gray-500 dark:text-white/40">
        Manage your profile and preferences.
      </p>

      <div className="flex flex-col gap-6">
        {/* Profile section */}
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-5 dark:border-white/[0.07] dark:bg-white/[0.02]">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-white/35">
            Profile
          </h2>

          {/* Avatar */}
          <div className="mb-5 flex items-center gap-4">
            <div className="relative">
              <Avatar username={current || "?"} avatarUrl={avatarUrl} size={56} />
              {uploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                  <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploadingAvatar}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:border-white/[0.08] dark:text-white/50 dark:hover:bg-white/[0.05]"
              >
                {uploadingAvatar ? "Uploading…" : "Change photo"}
              </button>
              {avatarUrl && (
                <button
                  onClick={handleRemoveAvatar}
                  disabled={uploadingAvatar}
                  className="text-xs text-gray-400 hover:text-red-500 disabled:opacity-50 dark:text-white/25 dark:hover:text-red-400"
                >
                  Remove
                </button>
              )}
              {avatarSuccess && (
                <span className="text-xs text-green-600 dark:text-green-400">Photo updated ✓</span>
              )}
            </div>
          </div>

          {/* Username */}
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-white/40">
                Username
              </label>
              <input
                value={username}
                onChange={(e) => {
                  setUsername(
                    e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                  );
                  setSuccess(false);
                }}
                placeholder="your_username"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-300 focus:border-blue-500/50 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:placeholder:text-white/20 dark:focus:border-blue-500/30"
              />
              <p className="mt-1.5 text-xs text-gray-400 dark:text-white/25">
                Lowercase letters, numbers, and underscores only.
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
            )}
            {success && (
              <p className="text-sm text-green-600 dark:text-green-400">
                Username updated ✓
              </p>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={!username.trim() || username === current || saving}
                className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400 dark:disabled:from-white/[0.06] dark:disabled:to-white/[0.06] dark:disabled:text-white/25"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              {current && (
                <Link
                  href={`/profile/${current}`}
                  className="text-sm text-gray-400 hover:text-gray-700 dark:text-white/30 dark:hover:text-white/60"
                >
                  View profile →
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Appearance section */}
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-5 dark:border-white/[0.07] dark:bg-white/[0.02]">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-white/35">
            Appearance
          </h2>
          <button
            onClick={toggle}
            className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white/70 dark:hover:bg-white/[0.06]"
          >
            <span>{theme === "dark" ? "Dark mode" : "Light mode"}</span>
            <span className="text-base">{theme === "dark" ? "🌙" : "☀️"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
