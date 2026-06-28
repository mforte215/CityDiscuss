"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/avatar";
import { DeleteCommentButton } from "@/components/delete-comment-button";
import { CommentForm } from "@/components/comment-form";

type Comment = {
  id: string;
  body: string;
  created_at: string | null;
  user_id: string;
  profiles: { username: string; avatar_url: string | null } | null;
};

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function RealtimeComments({
  postId,
  slug,
  initialComments,
  currentUserId,
}: {
  postId: string;
  slug: string;
  initialComments: Comment[];
  currentUserId: string | null;
}) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const seenIds = useRef(new Set(initialComments.map((c) => c.id)));

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`comments:${postId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
          filter: `post_id=eq.${postId}`,
        },
        async (payload) => {
          const newId = payload.new.id as string;
          if (seenIds.current.has(newId)) return;
          seenIds.current.add(newId);

          // Fetch the comment with profile join
          const { data } = await supabase
            .from("comments")
            .select("*, profiles(username, avatar_url)")
            .eq("id", newId)
            .single();

          if (data) setComments((prev) => [...prev, data as Comment]);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "comments",
          filter: `post_id=eq.${postId}`,
        },
        (payload) => {
          const deletedId = payload.old.id as string;
          seenIds.current.delete(deletedId);
          setComments((prev) => prev.filter((c) => c.id !== deletedId));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId]);

  return (
    <div className="mt-8">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/40">
        {comments.length} {comments.length === 1 ? "reply" : "replies"}
      </h2>

      <div className="flex flex-col gap-0.5">
        {comments.map((c) => {
          const cAuthor = c.profiles?.username || "anonymous";
          return (
            <div
              key={c.id}
              className="rounded-xl border border-gray-100 bg-gray-50 px-5 py-4 dark:border-white/5 dark:bg-white/[0.02]"
            >
              <div className="mb-2 flex items-center gap-2.5">
                <Avatar username={cAuthor} avatarUrl={c.profiles?.avatar_url} size={28} />
                <Link
                  href={`/profile/${cAuthor}`}
                  className="text-sm font-semibold text-gray-900 hover:text-blue-500 dark:text-white dark:hover:text-blue-400"
                >
                  @{cAuthor}
                </Link>
                <span className="text-[11px] text-gray-400 dark:text-white/20">
                  {c.created_at ? timeAgo(c.created_at) : "just now"}
                </span>
                <div className="ml-auto">
                  <DeleteCommentButton
                    commentId={c.id}
                    authorId={c.user_id}
                    currentUserId={currentUserId}
                  />
                </div>
              </div>
              <p className="pl-[38px] text-sm leading-relaxed text-gray-600 dark:text-white/50">
                {c.body}
              </p>
            </div>
          );
        })}
      </div>

      <CommentForm postId={postId} slug={slug} />
    </div>
  );
}
