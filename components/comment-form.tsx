"use client";

import { useState } from "react";
import { commentSchema } from "@/lib/schemas";

export function CommentForm({
  postId,
}: {
  postId: string;
  slug: string;
}) {
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!body.trim()) return;
    setError("");

    const result = commentSchema.safeParse({ body: body.trim() });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setLoading(true);

    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, body: body.trim() }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Something went wrong.");
      setLoading(false);
      return;
    }

    setBody("");
    setLoading(false);
    // No router.refresh() — realtime handles the new comment appearing
  }

  return (
    <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-white/[0.08] dark:bg-white/[0.03]">
      <label htmlFor="comment-body" className="sr-only">Add a reply</label>
      <textarea
        id="comment-body"
        placeholder="Add a reply..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        aria-describedby={error ? "comment-error" : undefined}
        aria-invalid={!!error || undefined}
        className="w-full resize-none bg-transparent text-sm leading-relaxed text-gray-900 outline-none placeholder:text-gray-400 dark:text-white dark:placeholder:text-white/20"
      />
      {error && <p id="comment-error" role="alert" className="mb-2 text-sm text-red-500 dark:text-red-400">{error}</p>}
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={!body.trim() || loading}
          className="rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400 dark:disabled:from-white/[0.06] dark:disabled:to-white/[0.06] dark:disabled:text-white/25"
        >
          {loading ? "Posting..." : "Reply"}
        </button>
      </div>
    </div>
  );
}
