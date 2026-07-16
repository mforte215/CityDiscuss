import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/avatar";
import { FollowButton } from "@/components/follow-button";

export async function generateMetadata(props: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await props.params;
  return {
    title: `@${username} — CityDiscuss`,
    description: `View ${username}'s comments and activity on CityDiscuss.`,
    openGraph: { title: `@${username} — CityDiscuss` },
  };
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: { user: currentUser } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (!profile) notFound();

  const [{ data: comments }, { data: followers }, { data: following }, { data: isFollowingRow }] =
    await Promise.all([
      (supabase as any)
        .from("article_comments")
        .select("id, body, created_at, articles(title, slug)")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(50),
      (supabase as any).from("follows").select("follower_id").eq("following_id", profile.id),
      (supabase as any).from("follows").select("following_id").eq("follower_id", profile.id),
      currentUser && currentUser.id !== profile.id
        ? (supabase as any).from("follows").select("follower_id").eq("follower_id", currentUser.id).eq("following_id", profile.id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  const followerCount = followers?.length ?? 0;
  const followingCount = following?.length ?? 0;
  const isFollowing = !!isFollowingRow;
  const isOwnProfile = currentUser?.id === profile.id;

  const joinDate = new Date(profile.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar username={profile.username} avatarUrl={profile.avatar_url} size={56} />
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              {profile.username}
            </h1>
            <p className="mt-0.5 text-sm text-gray-400 dark:text-white/30">
              Joined {joinDate}
            </p>
          </div>
        </div>
        {!isOwnProfile && currentUser && (
          <FollowButton profileId={profile.id} initialIsFollowing={isFollowing} />
        )}
      </div>

      {/* Stats row */}
      <div className="mb-8 flex gap-6 rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
        <div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {comments?.length ?? 0}
          </div>
          <div className="text-xs text-gray-400 dark:text-white/30">Comments</div>
        </div>
        <div className="w-px bg-gray-200 dark:bg-white/[0.06]" />
        <div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {followerCount}
          </div>
          <div className="text-xs text-gray-400 dark:text-white/30">Followers</div>
        </div>
        <div className="w-px bg-gray-200 dark:bg-white/[0.06]" />
        <div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {followingCount}
          </div>
          <div className="text-xs text-gray-400 dark:text-white/30">Following</div>
        </div>
      </div>

      {/* Comment history */}
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-white/30">
        Comments
      </h2>

      {comments && comments.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          {comments.map((comment: any) => (
            <Link
              key={comment.id}
              href={`/articles/${comment.articles?.slug}`}
              className="group rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 transition-all hover:border-blue-300 hover:bg-blue-50 dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-blue-500/25 dark:hover:bg-blue-500/[0.04]"
            >
              <p className="line-clamp-2 text-sm leading-snug text-gray-900 dark:text-white">
                {comment.body}
              </p>
              <p className="mt-1.5 truncate text-xs text-gray-400 dark:text-white/30">
                on {comment.articles?.title} · {timeAgo(comment.created_at)}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 dark:text-white/25">No comments yet.</p>
      )}
    </div>
  );
}
