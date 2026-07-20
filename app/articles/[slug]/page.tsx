import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/avatar";
import { ArticleCommentForm } from "@/components/article-comment-form";
import { DeleteArticleCommentButton } from "@/components/delete-article-comment-button";
import { ShareButton } from "@/components/share-button";
import { sanitizeContent } from "@/lib/sanitize";
import { AdUnit } from "@/components/ad-unit";
import Image from "next/image";

// Cached so generateMetadata and the page share one DB round-trip
const getArticle = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("articles")
    .select("*, profiles(username, avatar_url), article_tags(tags(id, name, slug))")
    .eq("slug", slug)
    .not("published_at", "is", null)
    .single();
  return data;
});

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const article = await getArticle(slug);
  if (!article) return {};
  return {
    title: `${article.title} — CityDiscuss`,
    description: article.subtitle ?? undefined,
    openGraph: {
      title: article.title,
      description: article.subtitle ?? undefined,
      images: article.cover_url
        ? [{ url: `${article.cover_url}?v=${new Date(article.created_at ?? article.published_at).getTime()}` }]
        : [],
      type: "article",
    },
    twitter: {
      card: article.cover_url ? "summary_large_image" : "summary",
      title: article.title,
      description: article.subtitle ?? undefined,
      images: article.cover_url
        ? [`${article.cover_url}?v=${new Date(article.created_at ?? article.published_at).getTime()}`]
        : [],
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
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Strip HTML tags and count words to estimate reading time */
function readingTime(html: string): string {
  const text = html.replace(/<[^>]+>/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 238)); // avg reading speed
  return `${minutes} min read`;
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const [article, { data: { user } }] = await Promise.all([
    getArticle(slug),
    supabase.auth.getUser(),
  ]);

  if (!article) notFound();

  // Extract tags for this article
  const articleTags = ((article.article_tags as any[]) ?? [])
    .map((at: any) => at.tags)
    .filter(Boolean) as { id: string; name: string; slug: string }[];

  const tagIds = articleTags.map((t) => t.id);

  // Fetch comments, admin check, and related articles (same tags) in parallel
  const [{ data: comments }, adminResult, { data: related }] = await Promise.all([
    supabase
      .from("article_comments")
      .select("*, profiles(username, avatar_url)")
      .eq("article_id", article.id)
      .order("created_at", { ascending: true }),
    user
      ? supabase.from("profiles").select("is_admin").eq("id", user.id).single()
      : Promise.resolve({ data: null }),
    tagIds.length > 0
      ? supabase
          .from("articles")
          .select("title, subtitle, slug, cover_url, cover_position, published_at, article_tags!inner(tag_id)")
          .in("article_tags.tag_id", tagIds)
          .neq("slug", slug)
          .not("published_at", "is", null)
          .order("published_at", { ascending: false })
          .limit(3)
      : Promise.resolve({ data: [] }),
  ]);

  const isAdmin = !!(adminResult as any)?.data?.is_admin;

  const publishDate = new Date(article.published_at).toLocaleDateString(
    "en-US",
    { month: "long", day: "numeric", year: "numeric" },
  );

  const readTime = article.body ? readingTime(article.body) : null;

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      {/* Back + admin edit */}
      <div className="mb-8 flex items-center justify-between">
        <Link
          href="/"
          className="text-sm text-gray-400 hover:text-gray-600 dark:text-white/30 dark:hover:text-white/55"
        >
          ← Back
        </Link>
        <div className="flex items-center gap-2">
          <ShareButton title={article.title} />
          {isAdmin && (
            <Link
              href={`/admin/articles/${slug}/edit`}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 dark:border-white/10 dark:text-white/40 dark:hover:bg-white/5"
            >
              Edit article
            </Link>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="mb-8">
        {articleTags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-3">
            {articleTags.map((tag) => (
              <Link
                key={tag.id}
                href={`/tags/${tag.slug}`}
                className="text-xs font-bold uppercase tracking-wide text-[var(--accent)] hover:underline"
              >
                {tag.name}
              </Link>
            ))}
          </div>
        )}
        <h1 className="mb-3 font-serif text-4xl font-bold leading-tight text-gray-900 dark:text-white">
          {article.title}
        </h1>
        {article.subtitle && (
          <p className="mb-4 text-xl leading-relaxed text-gray-600 dark:text-white/50">
            {article.subtitle}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 dark:text-white/30">
          {(article.profiles as any)?.username && (
            <div className="flex items-center gap-2">
              <Avatar
                username={(article.profiles as any).username}
                avatarUrl={(article.profiles as any).avatar_url}
                size={24}
              />
              <Link
                href={`/profile/${(article.profiles as any).username}`}
                className="font-medium text-gray-600 hover:text-gray-900 dark:text-white/50 dark:hover:text-white/80"
              >
                @{(article.profiles as any).username}
              </Link>
            </div>
          )}
          <span>·</span>
          <span>{publishDate}</span>
          {readTime && (
            <>
              <span>·</span>
              <span>{readTime}</span>
            </>
          )}
        </div>
      </div>

      {/* Cover image */}
      {article.cover_url && (
        <div className="relative mb-10 overflow-hidden border border-gray-200 dark:border-white/[0.07]" style={{ aspectRatio: "2.5/1" }}>
          <Image
            src={article.cover_url}
            alt={article.title}
            fill
            className="object-cover"
            style={{ objectPosition: article.cover_position ?? "center" }}
            priority
          />
        </div>
      )}

      {/* Body */}
      {article.body && (
        <div
          className="prose prose-lg max-w-none
            dark:prose-invert
            prose-headings:font-bold
            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
            prose-p:leading-relaxed prose-p:mb-5
            prose-a:text-[var(--accent)] prose-a:no-underline hover:prose-a:underline
            dark:prose-p:text-white/70
            dark:prose-strong:text-white
            prose-blockquote:border-[var(--accent)]
            dark:prose-blockquote:text-white/50
            prose-img:border prose-img:border-gray-200
            dark:prose-img:border-white/[0.07]
            prose-hr:border-gray-200 dark:prose-hr:border-white/10"
          dangerouslySetInnerHTML={{ __html: sanitizeContent(article.body) }}
        />
      )}

      {/* Related articles */}
      {related && related.length > 0 && (
        <div className="mt-14 border-t border-gray-100 pt-10 dark:border-white/[0.06]">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/30">
            Related articles
          </p>
          <div className="grid gap-6 sm:grid-cols-3">
            {related.map((r: any) => (
              <Link
                key={r.slug}
                href={`/articles/${r.slug}`}
                className="group"
              >
                {r.cover_url ? (
                  <div className="relative mb-2.5 aspect-video w-full overflow-hidden border border-gray-200 dark:border-white/[0.08]">
                    <Image
                      src={r.cover_url}
                      alt={r.title}
                      fill
                      className="object-cover"
                      style={{ objectPosition: r.cover_position ?? "center" }}
                    />
                  </div>
                ) : (
                  <div className="mb-2.5 flex aspect-video w-full items-center justify-center border border-gray-200 bg-gray-50 dark:border-white/[0.08] dark:bg-white/[0.02]">
                    <span className="text-2xl opacity-25">📰</span>
                  </div>
                )}
                <p className="line-clamp-2 font-serif text-base font-bold leading-snug text-gray-900 group-hover:underline dark:text-white">
                  {r.title}
                </p>
                <p className="mt-1 text-xs text-gray-400 dark:text-white/25">
                  {new Date(r.published_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Ad unit between article body and comments — a bodyless article is not
          publisher content, so it gets no ad. */}
      {article.body && (
        <AdUnit slot="6023073744" format="horizontal" className="my-10" />
      )}

      {/* Comments */}
      <div className="mt-14 border-t border-gray-100 pt-10 dark:border-white/[0.06]">
        <h2 className="mb-6 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/35">
          {comments?.length ?? 0}{" "}
          {(comments?.length ?? 0) === 1 ? "comment" : "comments"}
        </h2>

        {comments && comments.length > 0 && (
          <div className="mb-2 flex flex-col gap-0.5">
            {comments.map((c: any) => {
              const author = c.profiles?.username ?? "anonymous";
              return (
                <div
                  key={c.id}
                  className="border border-gray-100 bg-gray-50 px-5 py-4 dark:border-white/5 dark:bg-white/[0.02]"
                >
                  <div className="mb-2 flex items-center gap-2.5">
                    <Avatar
                      username={author}
                      avatarUrl={c.profiles?.avatar_url}
                      size={28}
                    />
                    <Link
                      href={`/profile/${author}`}
                      className="text-sm font-semibold text-gray-900 hover:text-[var(--accent)] dark:text-white dark:hover:text-[var(--accent-light)]"
                    >
                      @{author}
                    </Link>
                    <span className="text-[11px] text-gray-400 dark:text-white/20">
                      {timeAgo(c.created_at)}
                    </span>
                    <div className="ml-auto">
                      <DeleteArticleCommentButton
                        commentId={c.id}
                        authorId={c.user_id}
                        currentUserId={user?.id ?? null}
                      />
                    </div>
                  </div>
                  <p className="pl-[38px] text-sm leading-relaxed text-gray-600 dark:text-white/50">
                    {c.body}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        <ArticleCommentForm articleId={article.id} />
      </div>
    </div>
  );
}
