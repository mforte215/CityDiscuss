"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function VoteButton({
  postId,
  initialScore,
  initialUserVote,
  orientation = "vertical",
}: {
  postId: string;
  initialScore: number;
  initialUserVote: 1 | -1 | 0;
  orientation?: "vertical" | "horizontal";
}) {
  const router = useRouter();
  const [score, setScore] = useState(initialScore);
  const [userVote, setUserVote] = useState<1 | -1 | 0>(initialUserVote);
  const [loading, setLoading] = useState(false);

  async function vote(value: 1 | -1) {
    if (loading) return;
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth/login");
      setLoading(false);
      return;
    }

    const newVote: 1 | -1 | 0 = userVote === value ? 0 : value;
    const scoreDelta = newVote - userVote;
    setScore((s) => s + scoreDelta);
    setUserVote(newVote);

    if (newVote === 0) {
      await supabase
        .from("post_votes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("post_votes")
        .upsert({ post_id: postId, user_id: user.id, value: newVote });
    }

    setLoading(false);
    router.refresh();
  }

  const isHorizontal = orientation === "horizontal";

  return (
    <div
      className={`flex items-center gap-1 ${isHorizontal ? "flex-row" : "flex-col"}`}
      onClick={(e) => e.preventDefault()}
    >
      <button
        onClick={() => vote(1)}
        disabled={loading}
        aria-label="Upvote"
        className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
          userVote === 1
            ? "text-orange-400"
            : "text-white/20 hover:text-orange-400/70"
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill={userVote === 1 ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 4l8 8H4z" />
        </svg>
      </button>

      <span
        className={`min-w-[1.5rem] text-center text-xs font-bold tabular-nums ${
          userVote === 1
            ? "text-orange-400"
            : userVote === -1
              ? "text-blue-400"
              : "text-white/40"
        }`}
      >
        {score}
      </span>

      <button
        onClick={() => vote(-1)}
        disabled={loading}
        aria-label="Downvote"
        className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
          userVote === -1
            ? "text-blue-400"
            : "text-white/20 hover:text-blue-400/70"
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill={userVote === -1 ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 20l-8-8h16z" />
        </svg>
      </button>
    </div>
  );
}
