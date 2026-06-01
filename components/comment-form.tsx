"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function CommentForm({
  postId,
  slug,
}: {
  postId: string;
  slug: string;
}) {
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

    const { error: insertError } = await supabase.from("comments").insert({
      post_id: postId,
      user_id: user.id,
      body: body.trim(),
    });

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
    <div className="mt-5 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
      <textarea
        placeholder="Add a reply..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        className="w-full resize-none bg-transparent text-sm leading-relaxed text-white outline-none placeholder:text-white/20"
      />
      {error && <p className="mb-2 text-sm text-red-400">{error}</p>}
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={!body.trim() || loading}
          className="rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:from-white/[0.06] disabled:to-white/[0.06] disabled:text-white/25"
        >
          {loading ? "Posting..." : "Reply"}
        </button>
      </div>
    </div>
  );
}
