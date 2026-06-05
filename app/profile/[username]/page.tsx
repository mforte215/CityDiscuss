import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/avatar";

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (!profile) notFound();

  const { data: posts } = await supabase
    .from("posts")
    .select("*, cities(name, slug), post_votes(value), comments(count)")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  const joinDate = new Date(profile.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const totalScore = (posts ?? []).reduce((sum, post) => {
    const s =
      (post.post_votes as { value: number }[] | null)?.reduce(
        (a, v) => a + v.value,
        0,
      ) ?? 0;
    return sum + s;
  }, 0);

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
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

      {/* Stats row */}
      <div className="mb-8 flex gap-6 rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
        <div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {posts?.length ?? 0}
          </div>
          <div className="text-xs text-gray-400 dark:text-white/30">Posts</div>
        </div>
        <div className="w-px bg-gray-200 dark:bg-white/[0.06]" />
        <div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {totalScore}
          </div>
          <div className="text-xs text-gray-400 dark:text-white/30">
            Total votes
          </div>
        </div>
      </div>

      {/* Posts list */}
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-white/30">
        Posts
      </h2>

      {posts && posts.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          {posts.map((post: any) => {
            const score =
              (post.post_votes as { value: number }[] | null)?.reduce(
                (a, v) => a + v.value,
                0,
              ) ?? 0;
            const commentCount = post.comments?.[0]?.count ?? 0;
            const city = post.cities;

            return (
              <Link
                key={post.id}
                href={`/city/${city?.slug}/${post.id}`}
                className="group rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 transition-all hover:border-blue-300 hover:bg-blue-50 dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-blue-500/25 dark:hover:bg-blue-500/[0.04]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold leading-snug text-gray-900 dark:text-white">
                      {post.title}
                    </p>
                    <p className="mt-1 text-xs text-gray-400 dark:text-white/30">
                      {city?.name} · {timeAgo(post.created_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 text-xs text-gray-400 dark:text-white/25">
                    <span>{score} pts</span>
                    <span>{commentCount} comments</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-gray-400 dark:text-white/25">No posts yet.</p>
      )}
    </div>
  );
}
