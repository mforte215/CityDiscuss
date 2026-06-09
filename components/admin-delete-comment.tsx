"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AdminDeleteComment({
  commentId,
  table,
}: {
  commentId: string;
  table: "comments" | "article_comments";
}) {
  const router = useRouter();

  async function handleDelete() {
    if (!window.confirm("Delete this comment?")) return;
    const supabase = createClient();
    await supabase.from(table).delete().eq("id", commentId);
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      className="shrink-0 text-xs text-red-400/50 transition-colors hover:text-red-500"
    >
      Delete
    </button>
  );
}
