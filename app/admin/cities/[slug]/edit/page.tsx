"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function EditCityPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(props.params);
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [cityId, setCityId] = useState("");
  const [name, setName] = useState("");
  const [state, setState] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push("/auth/login"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();
      if (!profile?.is_admin) { router.push("/"); return; }

      const { data: city } = await supabase
        .from("cities")
        .select("id, name, state, description")
        .eq("slug", slug)
        .single();

      if (!city) { router.push("/admin/cities"); return; }

      setCityId(city.id);
      setName(city.name);
      setState(city.state);
      setDescription(city.description ?? "");
      setChecking(false);
    });
  }, [slug, router]);

  async function handleSave() {
    setSaving(true);
    setError("");
    setSaved(false);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("cities")
      .update({
        name: name.trim(),
        state: state.trim(),
        description: description.trim() || null,
      })
      .eq("id", cityId);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSaved(true);
    }
    setSaving(false);
  }

  if (checking) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-sm text-gray-400 dark:text-white/30">
        Loading...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-10">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/cities"
            className="text-sm text-gray-400 hover:text-gray-700 dark:text-white/35 dark:hover:text-white/60"
          >
            ← Cities
          </Link>
          <span className="text-gray-300 dark:text-white/15">/</span>
          <span className="text-sm text-gray-500 dark:text-white/40">
            {name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-sm text-green-600 dark:text-green-400">
              ✓ Saved
            </span>
          )}
          {error && (
            <span className="text-sm text-red-500 dark:text-red-400">
              {error}
            </span>
          )}
          <Link
            href={`/city/${slug}`}
            target="_blank"
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:border-white/10 dark:text-white/40 dark:hover:bg-white/5"
          >
            View live ↗
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {/* Name */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-white/35">
            City name
          </label>
          <input
            value={name}
            onChange={(e) => { setName(e.target.value); setSaved(false); }}
            className="w-full rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-lg font-bold text-gray-900 outline-none focus:border-blue-500/50 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:focus:border-blue-500/30"
          />
        </div>

        {/* State */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-white/35">
            State
          </label>
          <input
            value={state}
            onChange={(e) => { setState(e.target.value.toUpperCase().slice(0, 2)); setSaved(false); }}
            placeholder="e.g. PA"
            maxLength={2}
            className="w-24 rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 font-mono text-sm uppercase text-gray-900 outline-none focus:border-blue-500/50 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:focus:border-blue-500/30"
          />
        </div>

        {/* Description */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-white/35">
            Description{" "}
            <span className="normal-case text-gray-300 dark:text-white/20">
              (shown in the city hero)
            </span>
          </label>
          <textarea
            value={description}
            onChange={(e) => { setDescription(e.target.value); setSaved(false); }}
            rows={4}
            placeholder="A sentence or two about this city's community…"
            className="w-full resize-y rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-sm leading-relaxed text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500/50 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:placeholder:text-white/20 dark:focus:border-blue-500/30"
          />
          <p className="mt-1.5 text-xs text-gray-400 dark:text-white/25">
            {description.length} characters
            {description.length > 200 && (
              <span className="ml-2 text-amber-500">
                — consider keeping it under 200
              </span>
            )}
          </p>
        </div>

        {/* Slug (read-only) */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-white/35">
            Slug{" "}
            <span className="normal-case text-gray-300 dark:text-white/20">
              (read-only — changing would break URLs)
            </span>
          </label>
          <p className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 font-mono text-sm text-gray-400 dark:border-white/[0.05] dark:bg-white/[0.02] dark:text-white/25">
            /city/{slug}
          </p>
        </div>
      </div>
    </div>
  );
}
