import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CommentForm } from "@/components/comment-form";
import { VoteButton } from "@/components/vote-button";
import { DeleteEditButtons } from "@/components/delete-edit-buttons";
import { DeleteCommentButton } from "@/components/delete-comment-button";

function youtubeEmbedUrl(url: string): string | null {
  const ytMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/,
  );
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  return null;
}

function VideoEmbed({ url }: { url: string }) {
  const embedUrl = youtubeEmbedUrl(url);
  if (embedUrl) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.07]">
        <iframe
          src={embedUrl}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  return (
    <video
      src={url}
      controls
      className="w-full rounded-xl border border-gray-200 dark:border-white/[0.07]"
    />
  );
}

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

  const [
    { data: post },
    { data: comments },
    {
      data: { user },
    },
  ] = await Promise.all([
    supabase
      .from("posts")
      .select("*, user_id, profiles(username), post_votes(value)")
      .eq("id", postId)
      .single(),
    supabase
      .from("comments")
      .select("*, profiles(username)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true }),
    supabase.auth.getUser(),
  ]);

  if (!post) notFound();

  const author = post.profiles?.username || "anonymous";
  const score =
    (post.post_votes as { value: number }[] | null)?.reduce(
      (sum, v) => sum + v.value,
      0,
    ) ?? 0;

  let userVote: 1 | -1 | 0 = 0;
  if (user) {
    const { data: vote } = await supabase
      .from("post_votes")
      .select("value")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .single();
    if (vote) userVote = vote.value as 1 | -1;
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <Link
        href={`/city/${slug}`}
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 dark:text-white/35 dark:hover:text-white/55"
      >
        ← Back to discussions
      </Link>

      {/* Post */}
      <div className="rounded-2xl border border-gray-200 bg-gray-50 px-6 py-5 dark:border-white/[0.06] dark:bg-white/[0.03]">
        <div className="mb-4 flex items-center gap-3">
          <Avatar username={author} size={40} />
          <div className="flex flex-1 items-center justify-between">
            <div>
              <Link
                href={`/profile/${author}`}
                className="text-sm font-semibold text-gray-900 hover:text-blue-500 dark:text-white dark:hover:text-blue-400"
              >
                @{author}
              </Link>
              <span className="ml-2.5 text-xs text-gray-400 dark:text-white/25">
                {timeAgo(post.created_at)}
              </span>
            </div>
            <DeleteEditButtons
              postId={postId}
              slug={slug}
              authorId={post.user_id}
              currentUserId={user?.id ?? null}
              authorUsername={author}
            />
          </div>
        </div>

        <h1 className="mb-3 text-xl font-bold leading-snug tracking-[-0.02em] text-gray-900 dark:text-white">
          {post.title}
        </h1>

        {post.post_type === "photo" && post.media_url && (
          <div className="mb-4 overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.07]">
            <img
              src={post.media_url}
              alt={post.title}
              className="w-full object-contain"
            />
          </div>
        )}

        {post.post_type === "video" && post.media_url && (
          <div className="mb-4">
            <VideoEmbed url={post.media_url} />
          </div>
        )}

        {post.body && (
          <p className="text-[15px] leading-relaxed text-gray-600 dark:text-white/55">
            {post.body}
          </p>
        )}

        {/* Vote row */}
        <div className="mt-5 border-t border-gray-100 pt-4 dark:border-white/[0.05]">
          <VoteButton
            postId={postId}
            initialScore={score}
            initialUserVote={userVote}
            orientation="horizontal"
          />
        </div>
      </div>

      {/* Comments */}
      <div className="mt-8">
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/40">
          {comments?.length || 0} replies
        </h3>

        <div className="flex flex-col gap-0.5">
          {comments?.map((c) => {
            const cAuthor = c.profiles?.username || "anonymous";
            return (
              <div
                key={c.id}
                className="rounded-xl border border-gray-100 bg-gray-50 px-5 py-4 dark:border-white/5 dark:bg-white/[0.02]"
              >
                <div className="mb-2 flex items-center gap-2.5">
                  <Avatar username={cAuthor} size={28} />
                  <Link
                    href={`/profile/${cAuthor}`}
                    className="text-sm font-semibold text-gray-900 hover:text-blue-500 dark:text-white dark:hover:text-blue-400"
                  >
                    @{cAuthor}
                  </Link>
                  <span className="text-[11px] text-gray-400 dark:text-white/20">
                    {timeAgo(c.created_at)}
                  </span>
                  <div className="ml-auto">
                    <DeleteCommentButton
                      commentId={c.id}
                      authorId={c.user_id}
                      currentUserId={user?.id ?? null}
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
    </div>
  );
}
