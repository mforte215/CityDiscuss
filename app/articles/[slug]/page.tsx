import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/avatar";
import { ArticleCommentForm } from "@/components/article-comment-form";
import { DeleteArticleCommentButton } from "@/components/delete-article-comment-button";

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

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const [
    { data: article },
    {
      data: { user },
    },
  ] = await Promise.all([
    supabase
      .from("articles")
      .select("*, profiles(username, avatar_url), cities(name, slug)")
      .eq("slug", slug)
      .not("published_at", "is", null)
      .single(),
    supabase.auth.getUser(),
  ]);

  if (!article) notFound();

  // Fetch comments + commenter profiles in parallel with admin check
  const [{ data: comments }, adminResult] = await Promise.all([
    supabase
      .from("article_comments")
      .select("*, profiles(username, avatar_url)")
      .eq("article_id", article.id)
      .order("created_at", { ascending: true }),
    user
      ? supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .single()
      : Promise.resolve({ data: null }),
  ]);

  const isAdmin = !!(adminResult as any)?.data?.is_admin;

  const publishDate = new Date(article.published_at).toLocaleDateString(
    "en-US",
    { month: "long", day: "numeric", year: "numeric" },
  );

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
        {isAdmin && (
          <Link
            href={`/admin/articles/${slug}/edit`}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 dark:border-white/10 dark:text-white/40 dark:hover:bg-white/5"
          >
            Edit article
          </Link>
        )}
      </div>

      {/* Header */}
      <div className="mb-8">
        {article.cities && (
          <Link
            href={`/city/${article.cities.slug}`}
            className="mb-3 inline-block text-xs font-semibold uppercase tracking-widest text-blue-500 hover:text-blue-600 dark:text-blue-400/80 dark:hover:text-blue-400"
          >
            {article.cities.name}
          </Link>
        )}
        <h1 className="mb-3 text-4xl font-extrabold leading-tight tracking-[-0.03em] text-gray-900 dark:text-white">
          {article.title}
        </h1>
        {article.subtitle && (
          <p className="mb-4 text-xl leading-relaxed text-gray-500 dark:text-white/50">
            {article.subtitle}
          </p>
        )}
        <div className="flex items-center gap-3 text-sm text-gray-400 dark:text-white/30">
          {article.profiles?.username && (
            <div className="flex items-center gap-2">
              <Avatar
                username={article.profiles.username}
                avatarUrl={article.profiles.avatar_url}
                size={24}
              />
              <Link
                href={`/profile/${article.profiles.username}`}
                className="font-medium text-gray-600 hover:text-gray-900 dark:text-white/50 dark:hover:text-white/80"
              >
                @{article.profiles.username}
              </Link>
            </div>
          )}
          <span>·</span>
          <span>{publishDate}</span>
        </div>
      </div>

      {/* Cover image */}
      {article.cover_url && (
        <div className="mb-10 overflow-hidden rounded-2xl border border-gray-200 dark:border-white/[0.07]">
          <img
            src={article.cover_url}
            alt={article.title}
            className="w-full object-cover"
            style={{ objectPosition: article.cover_position ?? "center" }}
          />
        </div>
      )}

      {/* Body */}
      {article.body && (
        <div
          className="prose prose-lg max-w-none
            dark:prose-invert
            prose-headings:font-extrabold prose-headings:tracking-tight
            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
            prose-p:leading-relaxed prose-p:mb-5
            prose-a:text-blue-500 prose-a:no-underline hover:prose-a:underline
            dark:prose-p:text-white/70
            dark:prose-strong:text-white
            prose-blockquote:border-blue-500
            dark:prose-blockquote:text-white/50
            prose-img:rounded-xl prose-img:border prose-img:border-gray-200
            dark:prose-img:border-white/[0.07]
            prose-hr:border-gray-200 dark:prose-hr:border-white/10"
          dangerouslySetInnerHTML={{ __html: article.body }}
        />
      )}

      {/* Comments */}
      <div className="mt-14 border-t border-gray-100 pt-10 dark:border-white/[0.06]">
        <h2 className="mb-6 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/35">
          {comments?.length ?? 0}{" "}
          {(comments?.length ?? 0) === 1 ? "comment" : "comments"}
        </h2>

        {/* Comment list */}
        {comments && comments.length > 0 && (
          <div className="mb-2 flex flex-col gap-0.5">
            {comments.map((c: any) => {
              const author = c.profiles?.username ?? "anonymous";
              return (
                <div
                  key={c.id}
                  className="rounded-xl border border-gray-100 bg-gray-50 px-5 py-4 dark:border-white/5 dark:bg-white/[0.02]"
                >
                  <div className="mb-2 flex items-center gap-2.5">
                    <Avatar
                      username={author}
                      avatarUrl={c.profiles?.avatar_url}
                      size={28}
                    />
                    <Link
                      href={`/profile/${author}`}
                      className="text-sm font-semibold text-gray-900 hover:text-blue-500 dark:text-white dark:hover:text-blue-400"
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

        {/* Comment form */}
        <ArticleCommentForm articleId={article.id} />
      </div>
    </div>
  );
}
