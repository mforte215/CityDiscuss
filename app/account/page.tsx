"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AccountPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [current, setCurrent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/auth/login");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();
      if (profile) {
        setUsername(profile.username);
        setCurrent(profile.username);
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

    // Check if username is taken
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

  if (loading) {
    return (
      <div className="mx-auto max-w-sm px-6 py-20 text-sm text-white/30">
        Loading...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-20">
      <h1 className="mb-2 text-2xl font-bold tracking-tight">Your account</h1>
      <p className="mb-8 text-sm text-white/40">
        Update your username — this is how others see you.
      </p>

      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/35">
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
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-blue-500/30"
          />
          <p className="mt-1.5 text-xs text-white/25">
            Lowercase letters, numbers, and underscores only.
          </p>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {success && (
          <p className="text-sm text-green-400">
            Username updated successfully.
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={!username.trim() || username === current || saving}
          className="w-full rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 py-3 text-sm font-semibold text-white disabled:from-white/[0.06] disabled:to-white/[0.06] disabled:text-white/25"
        >
          {saving ? "Saving..." : "Save username"}
        </button>
      </div>
    </div>
  );
}
