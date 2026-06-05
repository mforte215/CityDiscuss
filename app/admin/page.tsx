import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

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

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default async function AdminDashboard() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) redirect("/");

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: totalUsers },
    { count: newUsers },
    { count: totalPosts },
    { count: newPosts },
    { count: totalArticles },
    { count: totalComments },
    { count: totalArticleComments },
    { data: recentPosts },
    { data: recentSignups },
    { data: topPostsRaw },
    { data: allCityPosts },
    { data: activityDates },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", oneWeekAgo),
    supabase.from("posts").select("*", { count: "exact", head: true }),
    supabase.from("posts").select("*", { count: "exact", head: true }).gte("created_at", oneWeekAgo),
    supabase.from("articles").select("*", { count: "exact", head: true }).not("published_at", "is", null),
    supabase.from("comments").select("*", { count: "exact", head: true }),
    supabase.from("article_comments").select("*", { count: "exact", head: true }),
    supabase
      .from("posts")
      .select("id, title, created_at, post_type, profiles(username), cities(name, slug)")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("profiles")
      .select("id, username, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("posts")
      .select("id, title, post_votes(value), profiles(username), cities(name, slug)")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("posts")
      .select("city_id, cities(name, slug)"),
    supabase
      .from("posts")
      .select("created_at")
      .gte("created_at", thirtyDaysAgo)
      .order("created_at", { ascending: true }),
  ]);

  // ── Top posts by vote score ──────────────────────────────────────
  const topPosts = (topPostsRaw ?? [])
    .map((p: any) => ({
      ...p,
      score: (p.post_votes as { value: number }[])?.reduce((s, v) => s + v.value, 0) ?? 0,
    }))
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, 5);

  // ── City breakdown ───────────────────────────────────────────────
  const cityMap = new Map<string, { name: string; slug: string; count: number }>();
  for (const post of allCityPosts ?? []) {
    const city = (post as any).cities;
    if (!city) continue;
    const key = city.slug;
    if (!cityMap.has(key)) cityMap.set(key, { name: city.name, slug: city.slug, count: 0 });
    cityMap.get(key)!.count++;
  }
  const cityBreakdown = Array.from(cityMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);
  const maxCityCount = Math.max(1, ...cityBreakdown.map((c) => c.count));

  // ── 30-day activity chart ────────────────────────────────────────
  const dayMap = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    dayMap.set(d.toISOString().slice(0, 10), 0);
  }
  for (const row of activityDates ?? []) {
    const day = row.created_at.slice(0, 10);
    if (dayMap.has(day)) dayMap.set(day, dayMap.get(day)! + 1);
  }
  const activityData = Array.from(dayMap.entries());
  const maxActivity = Math.max(1, ...activityData.map(([, v]) => v));

  const totalCommentsCombined = (totalComments ?? 0) + (totalArticleComments ?? 0);

  // ── Stat card helper ─────────────────────────────────────────────
  const stats = [
    { label: "Total users", value: totalUsers ?? 0, sub: `+${newUsers ?? 0} this week`, icon: "👥", color: "blue" },
    { label: "Forum posts", value: totalPosts ?? 0, sub: `+${newPosts ?? 0} this week`, icon: "💬", color: "violet" },
    { label: "Articles", value: totalArticles ?? 0, sub: "published", icon: "📰", color: "emerald" },
    { label: "Comments", value: totalCommentsCombined, sub: "across all content", icon: "🗨", color: "amber" },
  ];

  const colorMap: Record<string, string> = {
    blue:    "from-blue-500/10 to-blue-600/5 border-blue-200 dark:border-blue-500/20 dark:from-blue-500/[0.08] dark:to-blue-600/[0.03]",
    violet:  "from-violet-500/10 to-violet-600/5 border-violet-200 dark:border-violet-500/20 dark:from-violet-500/[0.08] dark:to-violet-600/[0.03]",
    emerald: "from-emerald-500/10 to-emerald-600/5 border-emerald-200 dark:border-emerald-500/20 dark:from-emerald-500/[0.08] dark:to-emerald-600/[0.03]",
    amber:   "from-amber-500/10 to-amber-600/5 border-amber-200 dark:border-amber-500/20 dark:from-amber-500/[0.08] dark:to-amber-600/[0.03]",
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">

      {/* ── Header ── */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Admin Dashboard
          </h1>
          <p className="mt-0.5 text-sm text-gray-400 dark:text-white/30">
            Site overview and activity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/tags"
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:border-white/10 dark:text-white/50 dark:hover:bg-white/5"
          >
            Tags
          </Link>
          <Link
            href="/admin/cities"
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:border-white/10 dark:text-white/50 dark:hover:bg-white/5"
          >
            Cities
          </Link>
          <Link
            href="/admin/articles"
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:border-white/10 dark:text-white/50 dark:hover:bg-white/5"
          >
            Articles
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:border-white/10 dark:text-white/40 dark:hover:bg-white/5"
          >
            ← Back to site
          </Link>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`rounded-2xl border bg-gradient-to-br px-5 py-4 ${colorMap[s.color]}`}
          >
            <div className="mb-2 text-2xl">{s.icon}</div>
            <p className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              {s.value.toLocaleString()}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-gray-500 dark:text-white/40">
              {s.label}
            </p>
            <p className="mt-1 text-xs text-gray-400 dark:text-white/25">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── 30-day activity chart ── */}
      <div className="mb-8 rounded-2xl border border-gray-200 bg-gray-50 px-6 py-5 dark:border-white/[0.07] dark:bg-white/[0.02]">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/30">
          Posts — last 30 days
        </p>
        <div className="flex h-24 items-end gap-px">
          {activityData.map(([day, count]) => (
            <div
              key={day}
              title={`${formatDate(day)}: ${count} post${count !== 1 ? "s" : ""}`}
              className="group relative flex-1 cursor-default"
            >
              <div
                className="w-full rounded-t-sm bg-blue-400 transition-colors group-hover:bg-blue-500 dark:bg-blue-500/60 dark:group-hover:bg-blue-400"
                style={{ height: `${Math.max(2, (count / maxActivity) * 96)}px` }}
              />
              {/* Tooltip */}
              <div className="pointer-events-none absolute bottom-full left-1/2 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-[10px] text-white group-hover:block dark:bg-white dark:text-gray-900">
                {formatDate(day)}: {count}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] text-gray-400 dark:text-white/20">
          <span>{formatDate(activityData[0]?.[0] ?? "")}</span>
          <span>Today</span>
        </div>
      </div>

      {/* ── Recent posts + signups ── */}
      <div className="mb-8 grid gap-6 lg:grid-cols-3">

        {/* Recent posts */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-gray-50 dark:border-white/[0.07] dark:bg-white/[0.02]">
          <div className="flex items-center justify-between px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/30">
              Recent posts
            </p>
            <Link href="/forum" className="text-xs text-blue-500 hover:underline">
              View all
            </Link>
          </div>
          <div className="flex flex-col divide-y divide-gray-100 dark:divide-white/[0.05]">
            {(recentPosts ?? []).map((post: any) => (
              <Link
                key={post.id}
                href={`/city/${post.cities?.slug}/${post.id}`}
                className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-gray-100 dark:hover:bg-white/[0.03]"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {post.title}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-white/25">
                    <span className="font-medium text-blue-500 dark:text-blue-400">
                      {post.cities?.name}
                    </span>
                    {" · "}@{post.profiles?.username}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-gray-400 dark:text-white/25">
                  {timeAgo(post.created_at)}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* New signups */}
        <div className="rounded-2xl border border-gray-200 bg-gray-50 dark:border-white/[0.07] dark:bg-white/[0.02]">
          <div className="flex items-center justify-between px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/30">
              New members
            </p>
          </div>
          <div className="flex flex-col divide-y divide-gray-100 dark:divide-white/[0.05]">
            {(recentSignups ?? []).map((u: any) => (
              <Link
                key={u.id}
                href={`/profile/${u.username}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-gray-100 dark:hover:bg-white/[0.03]"
              >
                <span className="text-sm font-medium text-gray-800 dark:text-white/70">
                  @{u.username}
                </span>
                <span className="text-xs text-gray-400 dark:text-white/25">
                  {timeAgo(u.created_at)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── City breakdown + Top posts ── */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* City breakdown */}
        <div className="rounded-2xl border border-gray-200 bg-gray-50 px-6 py-5 dark:border-white/[0.07] dark:bg-white/[0.02]">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/30">
            Posts by city
          </p>
          <div className="flex flex-col gap-2.5">
            {cityBreakdown.map((city) => (
              <div key={city.slug} className="flex items-center gap-3">
                <Link
                  href={`/city/${city.slug}`}
                  className="w-28 shrink-0 truncate text-right text-xs font-medium text-gray-600 hover:text-blue-500 dark:text-white/50 dark:hover:text-blue-400"
                >
                  {city.name}
                </Link>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-white/[0.07]">
                  <div
                    className="h-full rounded-full bg-blue-400 dark:bg-blue-500/70"
                    style={{ width: `${(city.count / maxCityCount) * 100}%` }}
                  />
                </div>
                <span className="w-6 shrink-0 text-right text-xs tabular-nums text-gray-400 dark:text-white/25">
                  {city.count}
                </span>
              </div>
            ))}
            {cityBreakdown.length === 0 && (
              <p className="text-sm text-gray-400 dark:text-white/25">No posts yet.</p>
            )}
          </div>
        </div>

        {/* Top posts by votes */}
        <div className="rounded-2xl border border-gray-200 bg-gray-50 dark:border-white/[0.07] dark:bg-white/[0.02]">
          <div className="px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/30">
              Top posts by votes
            </p>
          </div>
          <div className="flex flex-col divide-y divide-gray-100 dark:divide-white/[0.05]">
            {topPosts.map((post: any, i: number) => (
              <Link
                key={post.id}
                href={`/city/${(post.cities as any)?.slug}/${post.id}`}
                className="flex items-center gap-3 px-5 py-3 hover:bg-gray-100 dark:hover:bg-white/[0.03]"
              >
                <span className="w-5 shrink-0 text-center text-xs font-bold text-gray-400 dark:text-white/20">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {post.title}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-white/25">
                    {(post.cities as any)?.name} · @{(post.profiles as any)?.username}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1 text-xs font-semibold text-orange-500">
                  <span>⬆</span>
                  <span>{post.score}</span>
                </div>
              </Link>
            ))}
            {topPosts.length === 0 && (
              <p className="px-5 py-3 text-sm text-gray-400 dark:text-white/25">No votes yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
