"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { RichTextEditor } from "@/components/rich-text-editor";

export default function EditPostPage(props: {
  params: Promise<{ slug: string; postId: string }>;
}) {
  const { slug, postId } = use(props.params);
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [userId, setUserId] = useState("");
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
        router.push(`/city/${slug}/${postId}`);
        return;
      }

      setTitle(post.title);
      setBody(post.body ?? "");
      setUserId(user.id);
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
      .eq("id", postId)
      .eq("user_id", userId);

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
      <div className="mx-auto max-w-2xl px-6 py-20 text-sm text-gray-400 dark:text-white/30">
        Loading...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <button
        onClick={() => router.back()}
        className="mb-6 text-sm text-gray-400 hover:text-gray-600 dark:text-white/35 dark:hover:text-white/55"
      >
        ← Back
      </button>

      <h2 className="mb-6 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
        Edit post
      </h2>

      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-white/35">
            Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-[15px] text-gray-900 outline-none focus:border-blue-500/50 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:focus:border-blue-500/30"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-white/35">
            Details
          </label>
          {!loading && (
            <RichTextEditor
              key={postId}
              content={body}
              onChange={setBody}
              placeholder="Add more context or detail…"
            />
          )}
        </div>

        {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}

        <button
          onClick={handleSave}
          disabled={!title.trim() || saving}
          className="w-full rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 py-3 text-sm font-semibold text-white disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400 dark:disabled:from-white/[0.06] dark:disabled:to-white/[0.06] dark:disabled:text-white/25"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </div>
  );
}
