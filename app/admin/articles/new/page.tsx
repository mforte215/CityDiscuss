"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type City = { name: string; slug: string; id: string };

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function NewArticlePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [cities, setCities] = useState<City[]>([]);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [cityId, setCityId] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      if (!profile?.is_admin) {
        router.push("/");
        return;
      }

      const { data: cityData } = await supabase
        .from("cities")
        .select("id, name, slug")
        .order("name");

      if (cityData) setCities(cityData);
      setChecking(false);
    });
  }, [router]);

  function handleTitleChange(val: string) {
    setTitle(val);
    if (!slugManual) setSlug(slugify(val));
  }

  async function handleSave(publish: boolean) {
    if (!title.trim() || !slug.trim() || !body.trim()) {
      setError("Title, slug, and body are required.");
      return;
    }
    setSaving(true);
    setError("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error: insertError } = await supabase.from("articles").insert({
      title: title.trim(),
      subtitle: subtitle.trim() || null,
      slug: slug.trim(),
      city_id: cityId || null,
      cover_url: coverUrl.trim() || null,
      body: body.trim(),
      author_id: user!.id,
      published_at: publish ? new Date().toISOString() : null,
    });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    router.push("/admin/articles");
  }

  if (checking) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-sm text-gray-400 dark:text-white/30">
        Checking access...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          New article
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 disabled:opacity-40 dark:border-white/10 dark:text-white/50 dark:hover:bg-white/5"
          >
            Save draft
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            Publish
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {/* Title */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-white/35">
            Title
          </label>
          <input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Article title"
            className="w-full rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-xl font-bold text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500/50 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:placeholder:text-white/20 dark:focus:border-blue-500/30"
          />
        </div>

        {/* Subtitle */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-white/35">
            Subtitle{" "}
            <span className="normal-case text-gray-300 dark:text-white/20">(optional)</span>
          </label>
          <input
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="A short description or teaser"
            className="w-full rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-[15px] text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500/50 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:placeholder:text-white/20 dark:focus:border-blue-500/30"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-white/35">
            Slug
          </label>
          <input
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugManual(true);
            }}
            placeholder="article-url-slug"
            className="w-full rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 font-mono text-sm text-gray-600 outline-none placeholder:text-gray-400 focus:border-blue-500/50 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/70 dark:placeholder:text-white/20 dark:focus:border-blue-500/30"
          />
          <p className="mt-1 text-xs text-gray-400 dark:text-white/25">
            Will be live at /articles/{slug || "your-slug"}
          </p>
        </div>

        {/* City */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-white/35">
            City{" "}
            <span className="normal-case text-gray-300 dark:text-white/20">(optional)</span>
          </label>
          <select
            value={cityId}
            onChange={(e) => setCityId(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500/50 dark:border-white/[0.08] dark:bg-[#0f0f0f] dark:text-white dark:focus:border-blue-500/30"
          >
            <option value="">No city</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Cover image URL */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-white/35">
            Cover image URL{" "}
            <span className="normal-case text-gray-300 dark:text-white/20">(optional)</span>
          </label>
          <input
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
            placeholder="https://..."
            className="w-full rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500/50 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:placeholder:text-white/20 dark:focus:border-blue-500/30"
          />
          {coverUrl && (
            <div className="mt-2 overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.07]">
              <img
                src={coverUrl}
                alt="Cover preview"
                className="max-h-48 w-full object-cover"
              />
            </div>
          )}
        </div>

        {/* Body */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-white/35">
            Body{" "}
            <span className="normal-case text-gray-300 dark:text-white/20">(HTML)</span>
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="<p>Write your article here...</p>"
            rows={20}
            className="w-full resize-y rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 font-mono text-sm leading-relaxed text-gray-700 outline-none placeholder:text-gray-400 focus:border-blue-500/50 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/70 dark:placeholder:text-white/20 dark:focus:border-blue-500/30"
          />
          <p className="mt-1 text-xs text-gray-400 dark:text-white/25">
            Paste HTML or write it directly. Tiptap editor coming next.
          </p>
        </div>

        {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
      </div>
    </div>
  );
}
