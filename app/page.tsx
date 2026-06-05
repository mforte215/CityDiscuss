import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";

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
    day: "numeric",
    year: "numeric",
  });
}

export default async function Home() {
  const supabase = await createClient();

  const [{ data: articles }, { data: cities }] = await Promise.all([
    supabase
      .from("articles")
      .select("title, subtitle, slug, cover_url, cover_position, published_at, profiles(username), cities(name, slug)")
      .not("published_at", "is", null)
      .order("published_at", { ascending: false })
      .limit(20),
    supabase.from("cities").select("name, slug, state").order("name"),
  ]);

  const [featured, ...rest] = articles ?? [];

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      {/* Header */}
      <div className="mb-10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="CityDiscuss"
            width={40}
            height={40}
            className="rounded-xl block dark:hidden"
          />
          <Image
            src="/logo-dark.png"
            alt="CityDiscuss"
            width={40}
            height={40}
            className="rounded-xl hidden dark:block"
          />
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              CityDiscuss
            </h1>
            <p className="text-xs text-gray-400 dark:text-white/35">
              Local news and discussion
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/forum"
            className="hidden rounded-lg border border-gray-200 px-4 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:border-white/[0.08] dark:text-white/40 dark:hover:bg-white/[0.05] dark:hover:text-white/70 sm:block"
          >
            Forum →
          </Link>
        </div>
      </div>

      {articles && articles.length === 0 && (
        <div className="py-32 text-center text-sm text-gray-400 dark:text-white/25">
          No articles published yet.
        </div>
      )}

      {/* Featured article */}
      {featured && (
        <Link
          href={`/articles/${featured.slug}`}
          className="group mb-10 block overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 transition-all hover:border-gray-300 hover:bg-gray-100 dark:border-white/[0.07] dark:bg-white/[0.02] dark:hover:border-white/[0.12] dark:hover:bg-white/[0.04]"
        >
          {featured.cover_url && (
            <div className="aspect-[2.5/1] w-full overflow-hidden">
              <img
                src={featured.cover_url}
                alt={featured.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                style={{ objectPosition: featured.cover_position ?? "center" }}
              />
            </div>
          )}
          <div className="px-7 py-6">
            <div className="mb-2 flex items-center gap-2.5 text-xs text-gray-400 dark:text-white/30">
              {featured.cities && (
                <span className="font-semibold uppercase tracking-widest text-blue-500 dark:text-blue-400">
                  {(featured.cities as any).name}
                </span>
              )}
              {featured.cities && <span>·</span>}
              <span>{timeAgo(featured.published_at)}</span>
            </div>
            <h2 className="mb-2 text-2xl font-extrabold leading-snug tracking-[-0.02em] text-gray-900 dark:text-white sm:text-3xl">
              {featured.title}
            </h2>
            {featured.subtitle && (
              <p className="mb-4 text-base leading-relaxed text-gray-500 dark:text-white/50">
                {featured.subtitle}
              </p>
            )}
            <p className="text-sm text-gray-400 dark:text-white/30">
              By{" "}
              <span className="font-medium text-gray-600 dark:text-white/50">
                @{(featured.profiles as any)?.username ?? "staff"}
              </span>
            </p>
          </div>
        </Link>
      )}

      {/* Article grid */}
      {rest.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((article: any) => (
            <Link
              key={article.slug}
              href={`/articles/${article.slug}`}
              className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-gray-50 transition-all hover:border-gray-300 hover:bg-gray-100 dark:border-white/[0.07] dark:bg-white/[0.02] dark:hover:border-white/[0.12] dark:hover:bg-white/[0.04]"
            >
              {article.cover_url ? (
                <div className="aspect-video w-full overflow-hidden">
                  <img
                    src={article.cover_url}
                    alt={article.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    style={{ objectPosition: article.cover_position ?? "center" }}
                  />
                </div>
              ) : (
                <div className="flex aspect-video w-full items-center justify-center bg-gradient-to-br from-blue-500/10 to-blue-600/5 dark:from-blue-500/[0.08] dark:to-blue-600/[0.03]">
                  <span className="text-3xl opacity-30">📰</span>
                </div>
              )}
              <div className="flex flex-1 flex-col px-4 py-4">
                <div className="mb-1.5 flex items-center gap-2 text-[11px] text-gray-400 dark:text-white/30">
                  {article.cities && (
                    <span className="font-semibold uppercase tracking-widest text-blue-500 dark:text-blue-400">
                      {article.cities.name}
                    </span>
                  )}
                  {article.cities && <span>·</span>}
                  <span>{timeAgo(article.published_at)}</span>
                </div>
                <h3 className="mb-1 text-[15px] font-bold leading-snug tracking-[-0.01em] text-gray-900 dark:text-white">
                  {article.title}
                </h3>
                {article.subtitle && (
                  <p className="line-clamp-2 text-sm leading-relaxed text-gray-500 dark:text-white/40">
                    {article.subtitle}
                  </p>
                )}
                <p className="mt-auto pt-3 text-xs text-gray-400 dark:text-white/25">
                  @{article.profiles?.username ?? "staff"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* City links footer */}
      <div className="mt-12 border-t border-gray-100 pt-8 dark:border-white/[0.05]">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/25">
          Browse city forums
        </p>
        <div className="flex flex-wrap gap-2">
          {cities?.map((city) => (
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
    </div>
  );
}
