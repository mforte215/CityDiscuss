import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminArticlesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) redirect("/");

  const { data: articles } = await supabase
    .from("articles")
    .select("title, slug, subtitle, published_at, cities(name)")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Articles
        </h1>
        <Link
          href="/admin/articles/new"
          className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white"
        >
          + New article
        </Link>
      </div>

      {(!articles || articles.length === 0) && (
        <p className="text-sm text-gray-400 dark:text-white/30">
          No articles yet.
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        {articles?.map((article) => (
          <div
            key={article.slug}
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 dark:border-white/[0.07] dark:bg-white/[0.02]"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5">
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    article.published_at
                      ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400"
                      : "bg-gray-200 text-gray-500 dark:bg-white/[0.07] dark:text-white/35"
                  }`}
                >
                  {article.published_at ? "Published" : "Draft"}
                </span>
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                  {article.title}
                </p>
              </div>
              <p className="mt-0.5 truncate text-xs text-gray-400 dark:text-white/30">
                {(article.cities as any)?.name && (
                  <span className="mr-2 font-medium text-blue-500 dark:text-blue-400">
                    {(article.cities as any).name}
                  </span>
                )}
                {article.subtitle}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {article.published_at && (
                <Link
                  href={`/articles/${article.slug}`}
                  target="_blank"
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 dark:border-white/10 dark:text-white/40 dark:hover:bg-white/5"
                >
                  View
                </Link>
              )}
              <Link
                href={`/admin/articles/${article.slug}/edit`}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-white/10 dark:text-white/60 dark:hover:bg-white/5"
              >
                Edit
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
