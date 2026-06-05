"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CoverUpload } from "@/components/cover-upload";
import { RichTextEditor } from "@/components/rich-text-editor";
import { TagPicker } from "@/components/tag-picker";

type Tag = { id: string; name: string; slug: string };

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function NewArticlePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [userId, setUserId] = useState("");
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [coverUrl, setCoverUrl] = useState("");
  const [coverPosition, setCoverPosition] = useState("center");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push("/auth/login"); return; }

      const { data: profile } = await supabase
        .from("profiles").select("is_admin").eq("id", user.id).single();
      if (!profile?.is_admin) { router.push("/"); return; }

      const { data: tagData } = await supabase
        .from("tags").select("id, name, slug").order("name");

      setAvailableTags(tagData ?? []);
      setUserId(user.id);
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
    const { data: { user } } = await supabase.auth.getUser();

    const { data: article, error: insertError } = await supabase
      .from("articles")
      .insert({
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        slug: slug.trim(),
        cover_url: coverUrl || null,
        cover_position: coverPosition,
        body: body.trim(),
        author_id: user!.id,
        published_at: publish ? new Date().toISOString() : null,
      })
      .select("id")
      .single();

    if (insertError || !article) {
      setError(insertError?.message ?? "Failed to save.");
      setSaving(false);
      return;
    }

    // Insert tags
    if (selectedTagIds.length > 0) {
      await supabase.from("article_tags").insert(
        selectedTagIds.map((tagId) => ({ article_id: article.id, tag_id: tagId })),
      );
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
          <button onClick={() => handleSave(false)} disabled={saving}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 disabled:opacity-40 dark:border-white/10 dark:text-white/50 dark:hover:bg-white/5">
            Save draft
          </button>
          <button onClick={() => handleSave(true)} disabled={saving}
            className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">
            Publish
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {/* Title */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-white/35">Title</label>
          <input value={title} onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Article title"
            className="w-full rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-xl font-bold text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500/50 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:placeholder:text-white/20 dark:focus:border-blue-500/30" />
        </div>

        {/* Subtitle */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-white/35">
            Subtitle <span className="normal-case text-gray-300 dark:text-white/20">(optional)</span>
          </label>
          <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)}
            placeholder="A short description or teaser"
            className="w-full rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-[15px] text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500/50 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:placeholder:text-white/20 dark:focus:border-blue-500/30" />
        </div>

        {/* Slug */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-white/35">Slug</label>
          <input value={slug} onChange={(e) => { setSlug(e.target.value); setSlugManual(true); }}
            placeholder="article-url-slug"
            className="w-full rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 font-mono text-sm text-gray-600 outline-none placeholder:text-gray-400 focus:border-blue-500/50 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/70 dark:placeholder:text-white/20 dark:focus:border-blue-500/30" />
          <p className="mt-1 text-xs text-gray-400 dark:text-white/25">Will be live at /articles/{slug || "your-slug"}</p>
        </div>

        {/* Tags */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-white/35">
            Tags <span className="normal-case text-gray-300 dark:text-white/20">(optional)</span>
          </label>
          <TagPicker
            available={availableTags}
            selected={selectedTagIds}
            onChange={setSelectedTagIds}
          />
        </div>

        {/* Cover photo */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-white/35">
            Cover photo <span className="normal-case text-gray-300 dark:text-white/20">(optional)</span>
          </label>
          <CoverUpload
            userId={userId}
            coverUrl={coverUrl}
            coverPosition={coverPosition}
            onCoverUrl={setCoverUrl}
            onCoverPosition={setCoverPosition}
          />
        </div>

        {/* Body */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-white/35">Body</label>
          {userId && (
            <RichTextEditor content={body} onChange={setBody} userId={userId} placeholder="Write your article here…" />
          )}
        </div>

        {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
      </div>
    </div>
  );
}
