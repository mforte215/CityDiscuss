import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CommentForm } from "@/components/comment-form";

function Avatar({ username, size = 36 }: { username: string; size?: number }) {
  const colors = ["#2563eb", "#7c3aed", "#0891b2", "#059669", "#d97706"];
  const idx = username.charCodeAt(0) % colors.length;
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{
        width: size,
        height: size,
        background: colors[idx],
        fontSize: size * 0.35,
      }}
    >
      {username.slice(0, 2).toUpperCase()}
    </div>
  );
}

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

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string; postId: string }>;
}) {
  const { slug, postId } = await params;
  const supabase = await createClient();

  // Fetch post with author
  const { data: post } = await supabase
    .from("posts")
    .select("*, profiles(username)")
    .eq("id", postId)
    .single();

  if (!post) notFound();

  // Fetch comments with authors
  const { data: comments } = await supabase
    .from("comments")
    .select("*, profiles(username)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  const author = post.profiles?.username || "anonymous";

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <Link
        href={`/city/${slug}`}
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-white/35 hover:text-white/55"
      >
        ← Back to discussions
      </Link>

      {/* Post */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] px-6 py-5">
        <div className="mb-4 flex items-center gap-3">
          <Avatar username={author} size={40} />
          <div>
            <span className="text-sm font-semibold">@{author}</span>
            <span className="ml-2.5 text-xs text-white/25">
              {timeAgo(post.created_at)}
            </span>
          </div>
        </div>
        <h1 className="mb-3 text-xl font-bold leading-snug tracking-[-0.02em]">
          {post.title}
        </h1>
        <p className="text-[15px] leading-relaxed text-white/55">{post.body}</p>
      </div>

      {/* Comments */}
      <div className="mt-8">
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/40">
          {comments?.length || 0} replies
        </h3>

        <div className="flex flex-col gap-0.5">
          {comments?.map((c) => {
            const cAuthor = c.profiles?.username || "anonymous";
            return (
              <div
                key={c.id}
                className="rounded-xl border border-white/5 bg-white/[0.02] px-5 py-4"
              >
                <div className="mb-2 flex items-center gap-2.5">
                  <Avatar username={cAuthor} size={28} />
                  <span className="text-sm font-semibold">@{cAuthor}</span>
                  <span className="text-[11px] text-white/20">
                    {timeAgo(c.created_at)}
                  </span>
                </div>
                <p className="pl-[38px] text-sm leading-relaxed text-white/50">
                  {c.body}
                </p>
              </div>
            );
          })}
        </div>

        {/* Reply form */}
        <CommentForm postId={postId} slug={slug} />
      </div>
    </div>
  );
}
