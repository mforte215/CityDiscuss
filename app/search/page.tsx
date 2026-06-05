import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Search — CityDiscuss",
  description: "Search posts and articles across CityDiscuss.",
};

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
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

export default async function SearchPage(props: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await props.searchParams;
  const query = q?.trim() ?? "";

  const supabase = await createClient();

  const [{ data: posts }, { data: articles }] = query
    ? await Promise.all([
        supabase
          .from("posts")
          .select("id, title, body, created_at, profiles(username), cities(name, slug)")
          .ilike("title", `%${query}%`)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("articles")
          .select("title, subtitle, slug, published_at, cities(name, slug)")
          .ilike("title", `%${query}%`)
          .not("published_at", "is", null)
          .order("published_at", { ascending: false })
          .limit(10),
      ])
    : [{ data: null }, { data: null }];

  const hasResults =
    (posts && posts.length > 0) || (articles && articles.length > 0);

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
        Search
      </h1>

      {/* Search form */}
      <form method="GET" action="/search" className="mb-8">
        <div className="flex gap-2">
          <input
            name="q"
            defaultValue={query}
            placeholder="Search posts and articles…"
            autoFocus
            className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500/50 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:placeholder:text-white/25 dark:focus:border-blue-500/30"
          />
          <button
            type="submit"
            className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 px-5 py-3 text-sm font-semibold text-white"
          >
            Search
          </button>
        </div>
      </form>

      {/* No query yet */}
      {!query && (
        <p className="text-sm text-gray-400 dark:text-white/30">
          Enter a term above to search across all posts and articles.
        </p>
      )}

      {/* Query but no results */}
      {query && !hasResults && (
        <p className="text-sm text-gray-400 dark:text-white/30">
          No results for <span className="font-medium text-gray-700 dark:text-white/60">&ldquo;{query}&rdquo;</span>.
        </p>
      )}

      {/* Articles */}
      {articles && articles.length > 0 && (
        <div className="mb-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/25">
            Articles
          </p>
          <div className="flex flex-col gap-1.5">
            {articles.map((article: any) => (
              <Link
                key={article.slug}
                href={`/articles/${article.slug}`}
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 transition-all hover:border-blue-300 hover:bg-blue-50 dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-blue-500/25 dark:hover:bg-blue-500/[0.04]"
              >
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {article.title}
                </p>
                {article.subtitle && (
                  <p className="mt-0.5 line-clamp-1 text-xs text-gray-500 dark:text-white/40">
                    {article.subtitle}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-400 dark:text-white/25">
                  {article.cities?.name && (
                    <span className="mr-2 font-medium text-blue-500 dark:text-blue-400">
                      {article.cities.name}
                    </span>
                  )}
                  {timeAgo(article.published_at)}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Posts */}
      {posts && posts.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/25">
            Forum posts
          </p>
          <div className="flex flex-col divide-y divide-gray-100 dark:divide-white/[0.04]">
            {posts.map((post: any) => {
              const username = post.profiles?.username ?? "anonymous";
              const city = post.cities;
              return (
                <div key={post.id} className="relative py-3 first:pt-0">
                  <Link
                    href={`/city/${city?.slug}/${post.id}`}
                    className="absolute inset-0"
                    aria-label={post.title}
                  />
                  <p className="text-[15px] font-semibold text-gray-900 dark:text-white">
                    {post.title}
                  </p>
                  {post.body && (
                    <p className="mt-0.5 line-clamp-1 text-sm text-gray-500 dark:text-white/40">
                      {stripHtml(post.body)}
                    </p>
                  )}
                  <div className="mt-1 flex gap-3 text-xs text-gray-400 dark:text-white/25">
                    {city && (
                      <span className="font-semibold text-blue-500 dark:text-blue-400">
                        {city.name}
                      </span>
                    )}
                    <span>@{username}</span>
                    <span>{timeAgo(post.created_at)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
