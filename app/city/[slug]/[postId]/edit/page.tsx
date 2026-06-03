"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function EditPostPage(props: {
  params: Promise<{ slug: string; postId: string }>;
}) {
  const { slug, postId } = use(props.params);
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/auth/login");
        return;
      }
      const { data: post } = await supabase
        .from("posts")
        .select("title, body, user_id, post_type")
        .eq("id", postId)
        .single();

      if (!post || post.user_id !== user.id) {
        router.push(`/city/${slug}/${postId}`);
        return;
      }

      if (post.post_type !== "text") {
        // Only text posts are editable for now
        router.push(`/city/${slug}/${postId}`);
        return;
      }

      setTitle(post.title);
      setBody(post.body ?? "");
      setLoading(false);
    });
  }, [postId, slug, router]);

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    setError("");

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("posts")
      .update({ title: title.trim(), body: body.trim() || null })
      .eq("id", postId);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    router.push(`/city/${slug}/${postId}`);
    router.refresh();
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-sm text-white/30">
        Loading...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <button
        onClick={() => router.back()}
        className="mb-6 text-sm text-white/35 hover:text-white/55"
      >
        ← Back
      </button>

      <h2 className="mb-6 text-2xl font-bold tracking-tight">Edit post</h2>

      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/35">
            Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-[15px] text-white outline-none placeholder:text-white/20 focus:border-blue-500/30"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/35">
            Details
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            className="w-full resize-y rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm leading-relaxed text-white outline-none placeholder:text-white/20 focus:border-blue-500/30"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          onClick={handleSave}
          disabled={!title.trim() || saving}
          className="w-full rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 py-3 text-sm font-semibold text-white disabled:from-white/[0.06] disabled:to-white/[0.06] disabled:text-white/25"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </div>
  );
}
