import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { VoteButton } from "@/components/vote-button";
import { Avatar } from "@/components/avatar";
import { CityDropdown } from "@/components/city-dropdown";

export const metadata: Metadata = {
  title: "Forum — CityDiscuss",
  description: "Browse and join local discussions from cities across the country.",
};

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

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function hotScore(score: number, createdAt: string) {
  const ageHours = (Date.now() - new Date(createdAt).getTime()) / 1000 / 3600;
  return score / Math.pow(ageHours + 2, 1.5);
}

type Sort = "hot" | "new" | "top";

const PER_PAGE = 25;

export default async function ForumPage(props: {
  searchParams: Promise<{ sort?: string; city?: string; page?: string }>;
}) {
  const { sort: rawSort, city: cityFilter, page: rawPage } = await props.searchParams;
  const sort: Sort =
    rawSort === "top" ? "top" : rawSort === "new" ? "new" : "hot";
  const page = Math.max(1, parseInt(rawPage ?? "1", 10) || 1);

  const supabase = await createClient();

  const [
    { data: allPosts },
    { data: cities },
    {
      data: { user },
    },
  ] = await Promise.all([
    supabase
      .from("posts")
      .select(
        "*, profiles(username, avatar_url), comments(count), post_votes(value), cities(name, slug)",
      )
      .order("created_at", { ascending: false })
      .limit(500), // fetch enough to sort, then paginate in JS
    supabase.from("cities").select("name, slug").order("name"),
    supabase.auth.getUser(),
  ]);

  // Score every post
  const scored = (allPosts ?? []).map((post: any) => ({
    ...post,
    score:
      (post.post_votes as { value: number }[] | null)?.reduce(
        (sum: number, v: any) => sum + v.value,
        0,
      ) ?? 0,
  }));

  // Filter by city if selected
  const filtered = cityFilter
    ? scored.filter((p: any) => p.cities?.slug === cityFilter)
    : scored;

  // Sort
  const sorted = [...filtered];
  if (sort === "top") {
    sorted.sort((a, b) => b.score - a.score);
  } else if (sort === "new") {
    sorted.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  } else {
    sorted.sort(
      (a, b) =>
        hotScore(b.score, b.created_at) - hotScore(a.score, a.created_at),
    );
  }

  // User votes
  let userVotesMap: Record<string, 1 | -1> = {};
  if (user && sorted.length > 0) {
    const { data: votes } = await supabase
      .from("post_votes")
      .select("post_id, value")
      .eq("user_id", user.id)
      .in(
        "post_id",
        sorted.map((p) => p.id),
      );
    if (votes) {
      for (const v of votes) {
        userVotesMap[v.post_id] = v.value as 1 | -1;
      }
    }
  }

  const totalPosts = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalPosts / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginated = sorted.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const sortTabs: { label: string; icon: string; value: Sort }[] = [
    { label: "Hot", icon: "🔥", value: "hot" },
    { label: "New", icon: "✨", value: "new" },
    { label: "Top", icon: "⬆", value: "top" },
  ];

  const cityParam = cityFilter ? `&city=${cityFilter}` : "";
  const sortParam = sort !== "hot" ? `&sort=${sort}` : "";

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      {/* Page header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Forum
          </h1>
          <p className="mt-1 text-sm text-gray-400 dark:text-white/35">
            All discussions across every city
          </p>
        </div>
        <Link
          href="/new"
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(59,130,246,0.25)]"
        >
          <span className="text-base font-normal">+</span> New post
        </Link>
      </div>

      {/* Controls row: sort tabs + city dropdown */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        {/* Sort tabs */}
        <div className="flex gap-1">
          {sortTabs.map((tab) => (
            <Link
              key={tab.value}
              href={`/forum?sort=${tab.value}${cityParam}`}
              aria-current={sort === tab.value ? "page" : undefined}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                sort === tab.value
                  ? "bg-gray-100 text-gray-900 dark:bg-white/[0.08] dark:text-white"
                  : "text-gray-400 hover:text-gray-700 dark:text-white/30 dark:hover:text-white/60"
              }`}
            >
              <span aria-hidden="true">{tab.icon} </span>{tab.label}
            </Link>
          ))}
        </div>

        {/* City dropdown */}
        <CityDropdown
          cities={cities ?? []}
          current={cityFilter ?? ""}
          sort={sort}
        />
      </div>

      {/* Stats line */}
      <p className="mb-3 text-xs text-gray-400 dark:text-white/25">
        {totalPosts} {totalPosts === 1 ? "post" : "posts"}
        {cityFilter &&
          cities &&
          ` in ${cities.find((c) => c.slug === cityFilter)?.name}`}
        {totalPages > 1 && ` · page ${currentPage} of ${totalPages}`}
      </p>

      {/* Post list */}
      <div className="flex flex-col divide-y divide-gray-100 dark:divide-white/[0.04]">
        {paginated.map((post: any) => {
          const username = post.profiles?.username || "anonymous";
          const commentCount = post.comments?.[0]?.count || 0;
          const userVote = userVotesMap[post.id] ?? 0;
          const city = post.cities;

          return (
            <div
              key={post.id}
              className="group flex gap-3 py-3 first:pt-0 last:pb-0"
            >
              {/* Vote column */}
              <div className="relative z-10 flex shrink-0 flex-col items-center pt-0.5">
                <VoteButton
                  postId={post.id}
                  initialScore={post.score}
                  initialUserVote={userVote as 0 | 1 | -1}
                />
              </div>

              {/* Thumbnail */}
              {post.post_type === "photo" && post.media_url ? (
                <div className="relative mt-0.5 h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-gray-200 dark:border-white/[0.07]">
                  <img
                    src={post.media_url}
                    alt={post.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : post.post_type === "video" ? (
                <div className="mt-0.5 flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-100 text-xl dark:border-white/[0.07] dark:bg-white/[0.04]" aria-label="Video post">
                  <span aria-hidden="true">▶</span>
                </div>
              ) : (
                <div className="mt-0.5 shrink-0">
                  <Avatar username={username} avatarUrl={post.profiles?.avatar_url} />
                </div>
              )}

              {/* Content */}
              <div className="relative min-w-0 flex-1">
                <Link
                  href={`/city/${city?.slug}/${post.id}`}
                  className="absolute inset-0"
                  aria-label={post.title}
                />

                {/* Title row */}
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <h3 className="text-[15px] font-semibold leading-snug tracking-[-0.01em] text-gray-900 dark:text-white">
                    {post.title}
                  </h3>
                  {post.post_type !== "text" && (
                    <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400 ring-1 ring-gray-200 dark:text-white/30 dark:ring-white/10">
                      {post.post_type}
                    </span>
                  )}
                </div>

                {/* Body preview */}
                {post.body && (
                  <p className="mt-0.5 line-clamp-1 text-sm text-gray-500 dark:text-white/40">
                    {stripHtml(post.body)}
                  </p>
                )}

                {/* Meta row */}
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400 dark:text-white/25">
                  {city && (
                    <Link
                      href={`/city/${city.slug}`}
                      className="relative pointer-events-auto font-semibold text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {city.name}
                    </Link>
                  )}
                  <Link
                    href={`/profile/${username}`}
                    className="relative pointer-events-auto hover:text-gray-600 dark:hover:text-white/50"
                  >
                    @{username}
                  </Link>
                  <span>{timeAgo(post.created_at)}</span>
                  <span className="flex items-center gap-1">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-3 w-3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      aria-hidden="true"
                    >
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    <span className="sr-only">replies: </span>{commentCount}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {totalPosts === 0 && (
          <div className="py-20 text-center text-sm text-gray-400 dark:text-white/25">
            No posts yet.{" "}
            <Link href="/new" className="text-blue-500 hover:underline">
              Be the first to post!
            </Link>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          {currentPage > 1 ? (
            <Link
              href={`/forum?sort=${sort}${cityFilter ? `&city=${cityFilter}` : ""}&page=${currentPage - 1}`}
              aria-label={`Previous page, page ${currentPage - 1}`}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:border-white/10 dark:text-white/50 dark:hover:bg-white/5"
            >
              ← Previous
            </Link>
          ) : <div />}

          <span className="text-xs text-gray-400 dark:text-white/25">
            {currentPage} / {totalPages}
          </span>

          {currentPage < totalPages ? (
            <Link
              href={`/forum?sort=${sort}${cityFilter ? `&city=${cityFilter}` : ""}&page=${currentPage + 1}`}
              aria-label={`Next page, page ${currentPage + 1}`}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:border-white/10 dark:text-white/50 dark:hover:bg-white/5"
            >
              Next →
            </Link>
          ) : <div />}
        </div>
      )}

      {/* City tag footer */}
      {cities && cities.length > 0 && (
        <div className="mt-12 border-t border-gray-100 pt-8 dark:border-white/[0.05]">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/25">
            Browse by city
          </p>
          <div className="flex flex-wrap gap-2">
            {cities.map((city) => (
              <Link
                key={city.slug}
                href={`/city/${city.slug}`}
                className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700 dark:border-white/[0.07] dark:bg-white/[0.02] dark:text-white/45 dark:hover:border-white/15 dark:hover:text-white/70"
              >
                {city.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
