"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { CoverUpload } from "@/components/cover-upload";
import { RichTextEditor } from "@/components/rich-text-editor";
import { TagPicker } from "@/components/tag-picker";

type Tag = { id: string; name: string; slug: string };

export default function EditArticlePage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(props.params);
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [userId, setUserId] = useState<string>("");
  const [articleId, setArticleId] = useState<string>("");
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [articleSlug, setArticleSlug] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [coverPosition, setCoverPosition] = useState("center");
  const [body, setBody] = useState("");
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push("/auth/login"); return; }

      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles").select("is_admin").eq("id", user.id).single();
      if (!profile?.is_admin) { router.push("/"); return; }

      const [{ data: article }, { data: tagData }, { data: articleTagData }] =
        await Promise.all([
          supabase.from("articles").select("*").eq("slug", slug).single(),
          supabase.from("tags").select("id, name, slug").order("name"),
          supabase
            .from("article_tags")
            .select("tag_id")
            .eq("article_id",
              // we need the article id — fetch it first then get tags
              // workaround: fetch article first, use its id below
              "placeholder"
            ),
        ]);

      if (!article) { router.push("/admin/articles"); return; }

      // Fetch article tags properly with the real article id
      const { data: realArticleTags } = await supabase
        .from("article_tags")
        .select("tag_id")
        .eq("article_id", article.id);

      setArticleId(article.id);
      setTitle(article.title ?? "");
      setSubtitle(article.subtitle ?? "");
      setArticleSlug(article.slug ?? "");
      setCoverUrl(article.cover_url ?? "");
      setCoverPosition(article.cover_position ?? "center");
      setBody(article.body ?? "");
      setPublishedAt(article.published_at ?? null);
      setAvailableTags(tagData ?? []);
      setSelectedTagIds(realArticleTags?.map((t) => t.tag_id) ?? []);

      setChecking(false);
    });
  }, [slug, router]);

  async function handleSave(newPublishedAt: string | null | undefined) {
    if (!title.trim() || !articleSlug.trim() || !body.trim()) {
      setError("Title, slug, and body are required.");
      return;
    }
    setSaving(true);
    setError("");
    setSaved(false);

    const supabase = createClient();

    const { error: updateError } = await supabase
      .from("articles")
      .update({
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        slug: articleSlug.trim(),
        cover_url: coverUrl.trim() || null,
        cover_position: coverPosition,
        body: body.trim(),
        ...(newPublishedAt !== undefined ? { published_at: newPublishedAt } : {}),
      })
      .eq("id", articleId);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    // Sync tags: delete all then re-insert
    await supabase.from("article_tags").delete().eq("article_id", articleId);
    if (selectedTagIds.length > 0) {
      await supabase.from("article_tags").insert(
        selectedTagIds.map((tagId) => ({ article_id: articleId, tag_id: tagId })),
      );
    }

    if (newPublishedAt !== undefined) setPublishedAt(newPublishedAt);
    setSaved(true);
    setSaving(false);

    if (articleSlug.trim() !== slug) {
      router.replace(`/admin/articles/${articleSlug.trim()}/edit`);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this article permanently? This cannot be undone.")) return;
    setDeleting(true);
    setError("");

    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("articles").delete().eq("id", articleId);

    if (deleteError) {
      setError("Delete failed: " + deleteError.message);
      setDeleting(false);
      return;
    }
    router.push("/admin/articles");
  }

  if (checking) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-sm text-gray-400 dark:text-white/30">
        Loading...
      </div>
    );
  }

  const isPublished = !!publishedAt;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/articles" className="text-sm text-gray-400 hover:text-gray-700 dark:text-white/35 dark:hover:text-white/60">
            ← Articles
          </Link>
          <span className="text-gray-300 dark:text-white/15">/</span>
          <span className="text-sm text-gray-500 dark:text-white/40">Edit</span>
        </div>
        <div className="flex items-center gap-2">
          {isPublished && (
            <Link href={`/articles/${articleSlug}`} target="_blank"
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:border-white/10 dark:text-white/40 dark:hover:bg-white/5">
              View live ↗
            </Link>
          )}
          {isPublished ? (
            <button onClick={() => handleSave(null)} disabled={saving}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-40 dark:border-white/10 dark:text-white/50 dark:hover:bg-white/5">
              Unpublish
            </button>
          ) : (
            <button onClick={() => handleSave(new Date().toISOString())} disabled={saving}
              className="rounded-xl border border-green-300 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100 disabled:opacity-40 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-400 dark:hover:bg-green-500/15">
              Publish
            </button>
          )}
          <button onClick={() => handleSave(undefined)} disabled={saving}
            className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {/* Status bar */}
      <div className="mb-6 flex items-center gap-3">
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${
          isPublished
            ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400"
            : "bg-gray-200 text-gray-500 dark:bg-white/[0.07] dark:text-white/35"
        }`}>
          {isPublished ? "Published" : "Draft"}
        </span>
        {saved && <span className="text-sm text-green-600 dark:text-green-400">✓ Saved</span>}
        {error && <span className="text-sm text-red-500 dark:text-red-400">{error}</span>}
      </div>

      <div className="flex flex-col gap-5">
        {/* Title */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-white/35">Title</label>
          <input value={title} onChange={(e) => { setTitle(e.target.value); setSaved(false); }}
            placeholder="Article title"
            className="w-full rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-xl font-bold text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500/50 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:placeholder:text-white/20 dark:focus:border-blue-500/30" />
        </div>

        {/* Subtitle */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-white/35">
            Subtitle <span className="normal-case text-gray-300 dark:text-white/20">(optional)</span>
          </label>
          <input value={subtitle} onChange={(e) => { setSubtitle(e.target.value); setSaved(false); }}
            placeholder="A short description or teaser"
            className="w-full rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-[15px] text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500/50 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:placeholder:text-white/20 dark:focus:border-blue-500/30" />
        </div>

        {/* Slug */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-white/35">Slug</label>
          <input value={articleSlug} onChange={(e) => { setArticleSlug(e.target.value); setSaved(false); }}
            placeholder="article-url-slug"
            className="w-full rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 font-mono text-sm text-gray-600 outline-none placeholder:text-gray-400 focus:border-blue-500/50 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/70 dark:placeholder:text-white/20 dark:focus:border-blue-500/30" />
          <p className="mt-1 text-xs text-gray-400 dark:text-white/25">/articles/{articleSlug || "your-slug"}</p>
        </div>

        {/* Tags */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-white/35">
            Tags <span className="normal-case text-gray-300 dark:text-white/20">(optional)</span>
          </label>
          <TagPicker
            available={availableTags}
            selected={selectedTagIds}
            onChange={(ids) => { setSelectedTagIds(ids); setSaved(false); }}
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
            onCoverUrl={(url) => { setCoverUrl(url); setSaved(false); }}
            onCoverPosition={(pos) => { setCoverPosition(pos); setSaved(false); }}
          />
        </div>

        {/* Body */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-white/35">Body</label>
          {userId && !checking && (
            <RichTextEditor
              key={articleId}
              content={body}
              onChange={(html) => { setBody(html); setSaved(false); }}
              userId={userId}
              placeholder="Write your article here…"
            />
          )}
        </div>

        {/* Danger zone */}
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 dark:border-red-500/20 dark:bg-red-500/[0.04]">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-red-400">Danger zone</p>
          <button onClick={handleDelete} disabled={deleting}
            className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-40 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10">
            {deleting ? "Deleting…" : "Delete article"}
          </button>
        </div>
      </div>
    </div>
  );
}
