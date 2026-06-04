import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VoteButton } from "@/components/vote-button";

function Avatar({ username }: { username: string }) {
  const colors = ["#2563eb", "#7c3aed", "#0891b2", "#059669", "#d97706"];
  const idx = username.charCodeAt(0) % colors.length;
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
      style={{ width: 32, height: 32, background: colors[idx] }}
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
    .select("*, profiles(username), comments(count), post_votes(value)")
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
            className="mb-2 inline-block text-xs text-white/30 hover:text-white/50"
          >
            ← All cities
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {city.name}
          </h1>
          <p className="mt-1 text-sm text-white/30">
            {scored.length} discussions · {city.state}
          </p>
        </div>
        <Link
          href="/new"
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 px-5 py-2.5 text-sm font-semibold shadow-[0_0_24px_rgba(59,130,246,0.25)]"
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
                ? "bg-white/[0.08] text-white"
                : "text-white/30 hover:text-white/55"
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
              className="group flex gap-1 rounded-2xl border border-white/5 bg-white/[0.02] px-3 py-3 transition-all hover:border-white/10 hover:bg-white/[0.04]"
            >
              {/* Vote column — needs its own z-index to stay clickable */}
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
                  <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl border border-white/[0.07]">
                    <img
                      src={post.media_url}
                      alt={post.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : post.post_type === "video" ? (
                  <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.04] text-2xl">
                    ▶
                  </div>
                ) : (
                  <div className="pointer-events-none">
                    <Avatar username={username} />
                  </div>
                )}
                <div className="pointer-events-none min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[15px] font-semibold leading-snug tracking-[-0.01em]">
                      {post.title}
                    </h3>
                    {post.post_type !== "text" && (
                      <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/30 ring-1 ring-white/10">
                        {post.post_type}
                      </span>
                    )}
                  </div>
                  {post.body && (
                    <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-white/40">
                      {post.body}
                    </p>
                  )}
                  <div className="mt-2.5 flex gap-4 text-xs text-white/25">
                    <Link
                      href={`/profile/${username}`}
                      className="relative pointer-events-auto font-medium text-white/45 hover:text-blue-400"
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
          <div className="py-20 text-center text-sm text-white/25">
            No discussions yet — be the first to post!
          </div>
        )}
      </div>
    </div>
  );
}
