import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VoteButton } from "@/components/vote-button";
import { Avatar } from "@/components/avatar";

// ── City gradient — deterministic per city name ───────────────────
const GRADIENTS = [
  ["#1d4ed8", "#3b82f6"], // blue
  ["#047857", "#10b981"], // emerald
  ["#b45309", "#f59e0b"], // amber
  ["#7c3aed", "#a78bfa"], // violet
  ["#be123c", "#fb7185"], // rose
  ["#0369a1", "#38bdf8"], // sky
  ["#0f766e", "#2dd4bf"], // teal
  ["#9333ea", "#c084fc"], // purple
];

function cityGradient(name: string) {
  return GRADIENTS[name.charCodeAt(0) % GRADIENTS.length];
}

// Strip HTML for body previews (body is now rich text)
function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const supabase = await createClient();
  const { data: city } = await supabase
    .from("cities")
    .select("id, name, state")
    .eq("slug", slug)
    .single();
  if (!city) return {};
  const { count } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("city_id", city.id);
  if (!count) {
    return {
      title: `${city.name} — CityDiscuss`,
      robots: { index: false, follow: true },
    };
  }
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

  const [{ data: city }, { data: { user } }] = await Promise.all([
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

  // ── Stats computed from posts ───────────────────────────────────
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const postsThisWeek = scored.filter(
    (p) => new Date(p.created_at).getTime() > oneWeekAgo,
  ).length;

  const contributorMap = new Map<
    string,
    { username: string; avatarUrl: string | null; count: number }
  >();
  for (const post of scored) {
    const username = post.profiles?.username;
    if (!username) continue;
    if (!contributorMap.has(username)) {
      contributorMap.set(username, {
        username,
        avatarUrl: post.profiles?.avatar_url ?? null,
        count: 0,
      });
    }
    contributorMap.get(username)!.count++;
  }
  const topContributors = Array.from(contributorMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
  const uniqueContributors = contributorMap.size;
  const totalVotes = scored.reduce((sum, p) => sum + Math.max(0, p.score), 0);

  // ── Sort posts ──────────────────────────────────────────────────
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
      .in("post_id", scored.map((p) => p.id));
    if (votes) {
      for (const v of votes) userVotesMap[v.post_id] = v.value as 1 | -1;
    }
  }

  const [gradientFrom, gradientTo] = cityGradient(city.name);

  const sortTabs: { label: string; value: Sort; icon: string }[] = [
    { label: "Hot", value: "hot", icon: "🔥" },
    { label: "New", value: "new", icon: "✨" },
    { label: "Top", value: "top", icon: "⬆" },
  ];

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)` }}
      >
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-white/[0.07]" />

        <div className="relative mx-auto max-w-3xl px-6 py-10">
          {/* Back */}
          <Link
            href="/forum"
            className="mb-6 inline-flex items-center gap-1 text-xs font-medium text-white/60 hover:text-white/90"
          >
            ← All cities
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                {city.name}
              </h1>
              <p className="mt-1.5 text-base font-medium text-white/60">
                {city.state} &mdash; Local community
              </p>

              {/* Live stats */}
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/75">
                <span className="flex items-center gap-1.5">
                  <span className="text-base">💬</span>
                  <strong className="text-white">{scored.length}</strong> posts
                </span>
                <span className="text-white/30">·</span>
                <span className="flex items-center gap-1.5">
                  <span className="text-base">👥</span>
                  <strong className="text-white">{uniqueContributors}</strong> members
                </span>
                <span className="text-white/30">·</span>
                <span className="flex items-center gap-1.5">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${
                      postsThisWeek > 0 ? "bg-green-400" : "bg-white/30"
                    }`}
                  />
                  <strong className="text-white">{postsThisWeek}</strong> this week
                </span>
                {totalVotes > 0 && (
                  <>
                    <span className="text-white/30">·</span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-base">⬆</span>
                      <strong className="text-white">{totalVotes}</strong> votes
                    </span>
                  </>
                )}
              </div>

              {/* Description */}
              {city.description && (
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/70">
                  {city.description}
                </p>
              )}
            </div>

            <Link
              href={`/new?city=${slug}`}
              className="shrink-0 rounded-xl bg-white px-5 py-2.5 text-sm font-bold shadow-lg transition-opacity hover:opacity-90"
              style={{ color: gradientFrom }}
            >
              + New post
            </Link>
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────── */}
      <div className="mx-auto max-w-3xl px-6 py-8">

        {/* Top contributors */}
        {topContributors.length > 0 && (
          <div className="mb-8 rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 dark:border-white/[0.07] dark:bg-white/[0.02]">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/30">
              Top contributors
            </p>
            <div className="flex flex-wrap gap-3">
              {topContributors.map((c) => (
                <Link
                  key={c.username}
                  href={`/profile/${c.username}`}
                  className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm transition-all hover:border-gray-300 hover:shadow-sm dark:border-white/[0.07] dark:bg-white/[0.03] dark:hover:border-white/15"
                >
                  <Avatar username={c.username} avatarUrl={c.avatarUrl} size={28} />
                  <div>
                    <p className="font-semibold leading-none text-gray-900 dark:text-white">
                      @{c.username}
                    </p>
                    <p className="mt-0.5 text-[11px] text-gray-400 dark:text-white/30">
                      {c.count} {c.count === 1 ? "post" : "posts"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Sort tabs */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex gap-1">
            {sortTabs.map((tab) => (
              <Link
                key={tab.value}
                href={`/city/${slug}?sort=${tab.value}`}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  sort === tab.value
                    ? "bg-gray-100 text-gray-900 dark:bg-white/[0.08] dark:text-white"
                    : "text-gray-400 hover:text-gray-600 dark:text-white/30 dark:hover:text-white/55"
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </Link>
            ))}
          </div>
          <span className="text-xs text-gray-400 dark:text-white/25">
            {scored.length} {scored.length === 1 ? "post" : "posts"}
          </span>
        </div>

        {/* Post list */}
        <div className="flex flex-col gap-0.5">
          {scored.map((post: any) => {
            const username = post.profiles?.username || "anonymous";
            const commentCount = post.comments?.[0]?.count || 0;
            const userVote = userVotesMap[post.id] ?? 0;
            const bodyText = post.body ? stripHtml(post.body) : null;

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

                {/* Content */}
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
                    {bodyText && (
                      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-gray-500 dark:text-white/40">
                        {bodyText}
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
            <div className="py-20 text-center">
              <p className="text-sm text-gray-400 dark:text-white/25">
                No discussions yet.
              </p>
              <Link
                href={`/new?city=${slug}`}
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg"
                style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
              >
                + Start the first discussion
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
