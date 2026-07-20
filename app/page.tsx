import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { AdUnit } from "@/components/ad-unit";

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

export default async function Home(props: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag: tagFilter } = await props.searchParams;
  const supabase = await createClient();

  const [{ data: allArticles }, { data: allTags }] = await Promise.all([
    supabase
      .from("articles")
      .select("title, subtitle, slug, cover_url, cover_position, published_at, profiles(username), article_tags(tags(id, name, slug))")
      .not("published_at", "is", null)
      .order("published_at", { ascending: false })
      .limit(50),
    supabase.from("tags").select("id, name, slug").order("name"),
  ]);

  // Filter by tag client-side (simple and avoids complex nested Supabase filters)
  const articles = tagFilter
    ? (allArticles ?? []).filter((a: any) =>
        (a.article_tags as any[])?.some((at: any) => at.tags?.slug === tagFilter),
      ).slice(0, 20)
    : (allArticles ?? []).slice(0, 20);

  const [featured, ...rest] = articles;

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      {/* Header */}
      <div className="mb-8 border-b-2 border-black/90 pb-6 dark:border-white/80">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          CityDiscuss
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-white/40">
          Local news and discussion
        </p>
      </div>

      {/* Tag filter strip */}
      {allTags && allTags.length > 0 && (
        <div className="mb-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-gray-200 pb-4 text-sm dark:border-white/[0.08]">
          <Link
            href="/"
            className={`font-semibold uppercase tracking-wide transition-colors ${
              !tagFilter
                ? "text-gray-900 underline decoration-2 underline-offset-4 dark:text-white"
                : "text-gray-400 hover:text-gray-700 dark:text-white/35 dark:hover:text-white/70"
            }`}
          >
            All
          </Link>
          {allTags.map((tag) => (
            <Link
              key={tag.slug}
              href={`/?tag=${tag.slug}`}
              className={`font-semibold uppercase tracking-wide transition-colors ${
                tagFilter === tag.slug
                  ? "text-gray-900 underline decoration-2 underline-offset-4 dark:text-white"
                  : "text-gray-400 hover:text-gray-700 dark:text-white/35 dark:hover:text-white/70"
              }`}
            >
              {tag.name}
            </Link>
          ))}
        </div>
      )}

      {articles && articles.length === 0 && (
        <div className="py-32 text-center text-sm text-gray-400 dark:text-white/25">
          No articles published yet.
        </div>
      )}

      {/* Featured article */}
      {featured && (
        <div className="group relative mb-10 border-b border-gray-200 pb-10 dark:border-white/[0.08]">
          {/* Overlay link covers the whole card */}
          <Link href={`/articles/${featured.slug}`} className="absolute inset-0 z-10" aria-label={featured.title} />
          {featured.cover_url && (
            <div className="relative mb-5 aspect-[2.5/1] w-full overflow-hidden border border-gray-200 dark:border-white/[0.08]">
              <Image
                src={featured.cover_url}
                alt={featured.title}
                fill
                className="object-cover"
                style={{ objectPosition: featured.cover_position ?? "center" }}
                priority
              />
            </div>
          )}
          <div className="relative">
            <div className="mb-3 flex flex-wrap items-center gap-2.5 text-xs">
              {((featured.article_tags as any[]) ?? []).map((at: any) =>
                at.tags ? (
                  <Link key={at.tags.slug} href={`/?tag=${at.tags.slug}`}
                    className="relative z-20 font-bold uppercase tracking-wide text-[var(--accent)] hover:underline">
                    {at.tags.name}
                  </Link>
                ) : null,
              )}
              <span className="text-gray-400 dark:text-white/40">{featured.published_at ? timeAgo(featured.published_at) : null}</span>
            </div>
            <h2 className="mb-2 font-serif text-3xl font-bold leading-snug text-gray-900 dark:text-white sm:text-4xl">
              {featured.title}
            </h2>
            {featured.subtitle && (
              <p className="mb-4 text-lg leading-relaxed text-gray-600 dark:text-white/50">
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
        </div>
      )}

      {/* Article grid */}
      {rest.length > 0 && (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((article: any) => (
            <div
              key={article.slug}
              className="group relative flex flex-col"
            >
              <Link href={`/articles/${article.slug}`} className="absolute inset-0 z-10" aria-label={article.title} />
              {article.cover_url ? (
                <div className="relative mb-3 aspect-video w-full overflow-hidden border border-gray-200 dark:border-white/[0.08]">
                  <Image
                    src={article.cover_url}
                    alt={article.title}
                    fill
                    className="object-cover"
                    style={{ objectPosition: article.cover_position ?? "center" }}
                  />
                </div>
              ) : (
                <div className="mb-3 flex aspect-video w-full items-center justify-center border border-gray-200 bg-gray-50 dark:border-white/[0.08] dark:bg-white/[0.02]">
                  <span className="text-3xl opacity-30" aria-hidden="true">📰</span>
                </div>
              )}
              <div className="relative flex flex-1 flex-col">
                <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs">
                  {((article.article_tags as any[]) ?? []).map((at: any) =>
                    at.tags ? (
                      <Link key={at.tags.slug} href={`/?tag=${at.tags.slug}`}
                        className="relative z-20 font-bold uppercase tracking-wide text-[var(--accent)] hover:underline">
                        {at.tags.name}
                      </Link>
                    ) : null,
                  )}
                  <span className="text-gray-400 dark:text-white/30">{timeAgo(article.published_at)}</span>
                </div>
                <h3 className="mb-1 font-serif text-lg font-bold leading-snug text-gray-900 dark:text-white">
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
            </div>
          ))}
        </div>
      )}

      {/* Ad unit between articles and city links — only once there are articles
          to sit alongside; AdSense forbids ads on empty screens. */}
      {articles && articles.length > 0 && (
        <AdUnit slot="6023073744" format="horizontal" className="my-10" />
      )}

    </div>
  );
}
