"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NewPostPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(props.params);
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filled = title.trim() && body.trim();

  async function handleSubmit() {
    if (!filled) return;
    setLoading(true);
    setError("");

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("You must be logged in to post.");
      setLoading(false);
      return;
    }

    const { data: city } = await supabase
      .from("cities")
      .select("id")
      .eq("slug", slug)
      .single();

    if (!city) {
      setError("City not found.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("posts").insert({
      city_id: city.id,
      user_id: user.id,
      title: title.trim(),
      body: body.trim(),
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    router.push(`/city/${slug}`);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <button
        onClick={() => router.back()}
        className="mb-6 text-sm text-white/35 hover:text-white/55"
      >
        ← Back
      </button>

      <h2 className="mb-6 text-2xl font-bold tracking-tight">
        Start a discussion
      </h2>

      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/35">
            Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What's on your mind?"
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
            placeholder="Share more context, ask a question, or start a conversation..."
            rows={6}
            className="w-full resize-y rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm leading-relaxed text-white outline-none placeholder:text-white/20 focus:border-blue-500/30"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex justify-end gap-2.5">
          <button
            onClick={() => router.back()}
            className="rounded-xl border border-white/10 px-5 py-2.5 text-sm text-white/45 hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!filled || loading}
            className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(59,130,246,0.2)] disabled:from-white/[0.06] disabled:to-white/[0.06] disabled:text-white/25 disabled:shadow-none"
          >
            {loading ? "Posting..." : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
}
