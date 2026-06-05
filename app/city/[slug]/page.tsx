import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VoteButton } from "@/components/vote-button";
import { Avatar } from "@/components/avatar";

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const supabase = await createClient();
  const { data: city } = await supabase
    .from("cities")
    .select("name, state")
    .eq("slug", slug)
    .single();
  if (!city) return {};
  return {
    title: `${city.name} — CityDiscuss`,
    description: `Local discussions, news, and community for ${city.name}, ${city.state}.`,
    openGraph: {
      title: `${city.name} Forum — CityDiscuss`,
      description: `Join the conversation in ${city.name}, ${city.state}.`,
    },
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
  return `${days}d ago`;
}

function hotScore(score: number, createdAt: string) {
  const ageHours = (Date.now() - new Date(createdAt).getTime()) / 1000 / 3600;
  return score / Math.pow(ageHours + 2, 1.5);
}

type Sort = "hot" | "new" | "top";

export default async function CityPage(props: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const [{ slug }, { sort: rawSort }] = await Promise.all([
    props.params,
    props.searchParams,
  ]);

  const sort: Sort =
    rawSort === "top" ? "top" : rawSort === "new" ? "new" : "hot";

  const supabase = await createClient();

  const [
    { data: city },
    {
      data: { user },
    },
  ] = await Promise.all([
    supabase.from("cities").select("*").eq("slug", slug).single(),
    supabase.auth.getUser(),
  ]);

  if (!city) notFound();

  const { data: posts } = await supabase
    .from("posts")
    .select("*, profiles(username, avatar_url), comments(count), post_votes(value)")
    .eq("city_id", city.id);

  const scored = (posts ?? []).map((post: any) => ({
    ...post,
    score:
      (post.post_votes as { value: number }[] | null)?.reduce(
        (sum, v) => sum + v.value,
        0,
      ) ?? 0,
  }));

  if (sort === "top") {
    scored.sort((a, b) => b.score - a.score);
  } else if (sort === "new") {
    scored.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  } else {
    scored.sort(
      (a, b) =>
        hotScore(b.score, b.created_at) - hotScore(a.score, a.created_at),
    );
  }

  let userVotesMap: Record<string, 1 | -1> = {};
  if (user && scored.length > 0) {
    const { data: votes } = await supabase
      .from("post_votes")
      .select("post_id, value")
      .eq("user_id", user.id)
      .in(
        "post_id",
        scored.map((p) => p.id),
      );
    if (votes) {
      for (const v of votes) {
        userVotesMap[v.post_id] = v.value as 1 | -1;
      }
    }
  }

  const sortTabs: { label: string; value: Sort }[] = [
    { label: "Hot", value: "hot" },
    { label: "New", value: "new" },
    { label: "Top", value: "top" },
  ];

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <Link
            href="/"
            className="mb-2 inline-block text-xs text-gray-400 hover:text-gray-600 dark:text-white/30 dark:hover:text-white/50"
          >
            ← All cities
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            {city.name}
          </h1>
          <p className="mt-1 text-sm text-gray-400 dark:text-white/30">
            {scored.length} discussions · {city.state}
          </p>
        </div>
        <Link
          href="/new"
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(59,130,246,0.25)]"
        >
          <span className="text-base font-normal">+</span> New post
        </Link>
      </div>

      {/* Sort tabs */}
      <div className="mb-4 flex gap-1">
        {sortTabs.map((tab) => (
          <Link
            key={tab.value}
            href={`/city/${slug}?sort=${tab.value}`}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              sort === tab.value
                ? "bg-gray-100 text-gray-900 dark:bg-white/[0.08] dark:text-white"
                : "text-gray-400 hover:text-gray-600 dark:text-white/30 dark:hover:text-white/55"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="flex flex-col gap-0.5">
        {scored.map((post: any) => {
          const username = post.profiles?.username || "anonymous";
          const commentCount = post.comments?.[0]?.count || 0;
          const userVote = userVotesMap[post.id] ?? 0;

          return (
            <div
              key={post.id}
              className="group flex gap-1 rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3 transition-all hover:border-gray-200 hover:bg-gray-100 dark:border-white/5 dark:bg-white/[0.02] dark:hover:border-white/10 dark:hover:bg-white/[0.04]"
            >
              {/* Vote column */}
              <div className="relative z-10">
                <VoteButton
                  postId={post.id}
                  initialScore={post.score}
                  initialUserVote={userVote as 0 | 1 | -1}
                />
              </div>

              {/* Content with overlay link */}
              <div className="relative flex min-w-0 flex-1 gap-3 pl-1">
                <Link
                  href={`/city/${slug}/${post.id}`}
                  className="absolute inset-0"
                  aria-label={post.title}
                />
                {post.post_type === "photo" && post.media_url ? (
                  <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.07]">
                    <img
                      src={post.media_url}
                      alt={post.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : post.post_type === "video" ? (
                  <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-100 text-2xl dark:border-white/[0.07] dark:bg-white/[0.04]">
                    ▶
                  </div>
                ) : (
                  <div className="pointer-events-none">
                    <Avatar username={username} avatarUrl={post.profiles?.avatar_url} />
                  </div>
                )}
                <div className="pointer-events-none min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[15px] font-semibold leading-snug tracking-[-0.01em] text-gray-900 dark:text-white">
                      {post.title}
                    </h3>
                    {post.post_type !== "text" && (
                      <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400 ring-1 ring-gray-200 dark:text-white/30 dark:ring-white/10">
                        {post.post_type}
                      </span>
                    )}
                  </div>
                  {post.body && (
                    <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-gray-500 dark:text-white/40">
                      {post.body}
                    </p>
                  )}
                  <div className="mt-2.5 flex gap-4 text-xs text-gray-400 dark:text-white/25">
                    <Link
                      href={`/profile/${username}`}
                      className="pointer-events-auto relative font-medium text-gray-500 hover:text-blue-500 dark:text-white/45 dark:hover:text-blue-400"
                    >
                      @{username}
                    </Link>
                    <span>{timeAgo(post.created_at)}</span>
                    <span>💬 {commentCount}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {scored.length === 0 && (
          <div className="py-20 text-center text-sm text-gray-400 dark:text-white/25">
            No discussions yet — be the first to post!
          </div>
        )}
      </div>
    </div>
  );
}
