import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AdminDeletePost } from "@/components/admin-delete-post";
import { AdminDeleteComment } from "@/components/admin-delete-comment";

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default async function ModerationPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) redirect("/");

  const [{ data: posts }, { data: comments }, { data: articleComments }] = await Promise.all([
    supabase
      .from("posts")
      .select("id, title, created_at, post_type, profiles(username), cities(name, slug)")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("comments")
      .select("id, body, created_at, profiles(username), posts(id, title, cities(slug))")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("article_comments")
      .select("id, body, created_at, profiles(username), articles(slug, title)")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Moderation
          </h1>
          <p className="mt-0.5 text-sm text-gray-400 dark:text-white/30">
            Recent user-generated content
          </p>
        </div>
        <Link
          href="/admin"
          className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:border-white/10 dark:text-white/40 dark:hover:bg-white/5"
        >
          ← Dashboard
        </Link>
      </div>

      {/* Posts */}
      <section className="mb-10">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/30">
          Forum posts
        </p>
        <div className="divide-y divide-gray-100 rounded-2xl border border-gray-200 dark:divide-white/[0.05] dark:border-white/[0.07]">
          {(posts ?? []).map((post: any) => (
            <div key={post.id} className="flex items-center justify-between gap-4 px-5 py-3">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/city/${post.cities?.slug}/${post.id}`}
                  className="truncate text-sm font-medium text-gray-900 hover:text-blue-500 dark:text-white dark:hover:text-blue-400"
                >
                  {post.title}
                </Link>
                <p className="text-xs text-gray-400 dark:text-white/25">
                  @{post.profiles?.username} · {post.cities?.name} · {timeAgo(post.created_at)}
                </p>
              </div>
              <AdminDeletePost postId={post.id} />
            </div>
          ))}
          {!posts?.length && (
            <p className="px-5 py-4 text-sm text-gray-400 dark:text-white/25">No posts.</p>
          )}
        </div>
      </section>

      {/* Forum comments */}
      <section className="mb-10">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/30">
          Forum comments
        </p>
        <div className="divide-y divide-gray-100 rounded-2xl border border-gray-200 dark:divide-white/[0.05] dark:border-white/[0.07]">
          {(comments ?? []).map((comment: any) => (
            <div key={comment.id} className="flex items-center justify-between gap-4 px-5 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-gray-700 dark:text-white/70">{comment.body}</p>
                <p className="text-xs text-gray-400 dark:text-white/25">
                  @{comment.profiles?.username} · on &ldquo;{comment.posts?.title}&rdquo; · {timeAgo(comment.created_at)}
                </p>
              </div>
              <AdminDeleteComment commentId={comment.id} table="comments" />
            </div>
          ))}
          {!comments?.length && (
            <p className="px-5 py-4 text-sm text-gray-400 dark:text-white/25">No comments.</p>
          )}
        </div>
      </section>

      {/* Article comments */}
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/30">
          Article comments
        </p>
        <div className="divide-y divide-gray-100 rounded-2xl border border-gray-200 dark:divide-white/[0.05] dark:border-white/[0.07]">
          {(articleComments ?? []).map((comment: any) => (
            <div key={comment.id} className="flex items-center justify-between gap-4 px-5 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-gray-700 dark:text-white/70">{comment.body}</p>
                <p className="text-xs text-gray-400 dark:text-white/25">
                  @{comment.profiles?.username} · on &ldquo;{comment.articles?.title}&rdquo; · {timeAgo(comment.created_at)}
                </p>
              </div>
              <AdminDeleteComment commentId={comment.id} table="article_comments" />
            </div>
          ))}
          {!articleComments?.length && (
            <p className="px-5 py-4 text-sm text-gray-400 dark:text-white/25">No comments.</p>
          )}
        </div>
      </section>
    </div>
  );
}
