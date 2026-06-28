import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Image from "next/image";

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const supabase = await createClient();
  const { data: tag } = await supabase.from("tags").select("name").eq("slug", slug).single();
  if (!tag) return {};
  return {
    title: `${tag.name} — CityDiscuss`,
    description: `Articles tagged with ${tag.name} on CityDiscuss.`,
  };
}

export default async function TagPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const supabase = await createClient();

  const { data: tag } = await supabase
    .from("tags").select("id, name, slug").eq("slug", slug).single();

  if (!tag) notFound();

  const { data: articleTags } = await supabase
    .from("article_tags")
    .select("articles(title, subtitle, slug, cover_url, cover_position, published_at, profiles(username))")
    .eq("tag_id", tag.id);

  const articles = (articleTags ?? [])
    .map((at: any) => at.articles)
    .filter((a: any) => a && a.published_at)
    .sort((a: any, b: any) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <Link href="/" className="mb-4 inline-block text-sm text-gray-400 hover:text-gray-600 dark:text-white/30 dark:hover:text-white/55">
          ← All articles
        </Link>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-blue-100 px-4 py-1.5 text-sm font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-400">
            {tag.name}
          </span>
          <span className="text-sm text-gray-400 dark:text-white/30">
            {articles.length} {articles.length === 1 ? "article" : "articles"}
          </span>
        </div>
      </div>

      {articles.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-white/30">No articles with this tag yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {articles.map((article: any) => (
            <Link
              key={article.slug}
              href={`/articles/${article.slug}`}
              className="group flex gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 transition-all hover:border-gray-300 hover:bg-gray-100 dark:border-white/[0.07] dark:bg-white/[0.02] dark:hover:border-white/[0.12] dark:hover:bg-white/[0.04]"
            >
              {article.cover_url && (
                <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg">
                  <Image src={article.cover_url} alt={article.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                    style={{ objectPosition: article.cover_position ?? "center" }} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold leading-snug text-gray-900 dark:text-white">
                  {article.title}
                </h2>
                {article.subtitle && (
                  <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-white/40">
                    {article.subtitle}
                  </p>
                )}
                <p className="mt-2 text-xs text-gray-400 dark:text-white/25">
                  @{article.profiles?.username ?? "staff"} · {timeAgo(article.published_at)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
