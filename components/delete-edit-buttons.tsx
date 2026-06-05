"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function DeleteEditButtons({
  postId,
  slug,
  authorId,
  currentUserId,
  authorUsername,
}: {
  postId: string;
  slug: string;
  authorId: string;
  currentUserId: string | null;
  authorUsername: string;
}) {
  const router = useRouter();

  if (currentUserId !== authorId) return null;

  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this post? This cannot be undone.",
    );
    if (!confirmed) return;

    const supabase = createClient();
    await supabase.from("posts").delete().eq("id", postId);
    router.push(`/profile/${authorUsername}`);
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/city/${slug}/${postId}/edit`}
        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:border-white/10 dark:text-white/50 dark:hover:border-white/20 dark:hover:text-white/80"
      >
        Edit
      </Link>
      <button
        onClick={handleDelete}
        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-400 hover:border-red-400 hover:text-red-500 dark:border-red-500/20 dark:text-red-400/70 dark:hover:border-red-500/40 dark:hover:text-red-400"
      >
        Delete
      </button>
    </div>
  );
}
