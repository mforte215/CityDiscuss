"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function DeleteArticleCommentButton({
  commentId,
  authorId,
  currentUserId,
}: {
  commentId: string;
  authorId: string;
  currentUserId: string | null;
}) {
  const router = useRouter();

  if (currentUserId !== authorId) return null;

  async function handleDelete() {
    const confirmed = window.confirm("Delete this comment?");
    if (!confirmed) return;

    const supabase = createClient();
    await supabase.from("article_comments").delete().eq("id", commentId);
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      className="text-[11px] text-red-400/40 transition-colors hover:text-red-400"
    >
      Delete
    </button>
  );
}
