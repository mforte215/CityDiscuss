"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AdminDeletePost({ postId }: { postId: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!window.confirm("Delete this post and all its comments?")) return;
    const supabase = createClient();
    await supabase.from("posts").delete().eq("id", postId);
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
