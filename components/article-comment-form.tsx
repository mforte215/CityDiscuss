"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function ArticleCommentForm({ articleId }: { articleId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!body.trim()) return;
    setLoading(true);
    setError("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in to comment.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase
      .from("article_comments")
      .insert({ article_id: articleId, user_id: user.id, body: body.trim() });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setBody("");
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-white/[0.08] dark:bg-white/[0.03]">
      <textarea
        placeholder="Share your thoughts…"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        className="w-full resize-none bg-transparent text-sm leading-relaxed text-gray-900 outline-none placeholder:text-gray-400 dark:text-white dark:placeholder:text-white/20"
      />
      {error && (
        <p className="mb-2 text-sm text-red-500 dark:text-red-400">{error}</p>
      )}
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={!body.trim() || loading}
          className="rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400 dark:disabled:from-white/[0.06] dark:disabled:to-white/[0.06] dark:disabled:text-white/25"
        >
          {loading ? "Posting…" : "Reply"}
        </button>
      </div>
    </div>
  );
}
