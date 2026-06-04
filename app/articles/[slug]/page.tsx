import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: article } = await supabase
    .from("articles")
    .select("*, profiles(username), cities(name, slug)")
    .eq("slug", slug)
    .not("published_at", "is", null)
    .single();

  if (!article) notFound();

  const publishDate = new Date(article.published_at).toLocaleDateString(
    "en-US",
    { month: "long", day: "numeric", year: "numeric" },
  );

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      {/* Back */}
      <Link
        href="/"
        className="mb-8 inline-block text-sm text-white/30 hover:text-white/55"
      >
        ← Back
      </Link>

      {/* Header */}
      <div className="mb-8">
        {article.cities && (
          <Link
            href={`/city/${article.cities.slug}`}
            className="mb-3 inline-block text-xs font-semibold uppercase tracking-widest text-blue-400/80 hover:text-blue-400"
          >
            {article.cities.name}
          </Link>
        )}
        <h1 className="mb-3 text-4xl font-extrabold leading-tight tracking-[-0.03em]">
          {article.title}
        </h1>
        {article.subtitle && (
          <p className="mb-4 text-xl leading-relaxed text-white/50">
            {article.subtitle}
          </p>
        )}
        <div className="flex items-center gap-3 text-sm text-white/30">
          {article.profiles?.username && (
            <Link
              href={`/profile/${article.profiles.username}`}
              className="font-medium text-white/50 hover:text-white/80"
            >
              @{article.profiles.username}
            </Link>
          )}
          <span>·</span>
          <span>{publishDate}</span>
        </div>
      </div>

      {/* Cover image */}
      {article.cover_url && (
        <div className="mb-10 overflow-hidden rounded-2xl border border-white/[0.07]">
          <img
            src={article.cover_url}
            alt={article.title}
            className="w-full object-cover"
          />
        </div>
      )}

      {/* Body */}
      {article.body && (
        <div
          className="prose prose-invert prose-lg max-w-none
            prose-headings:font-extrabold prose-headings:tracking-tight
            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
            prose-p:text-white/70 prose-p:leading-relaxed prose-p:mb-5
            prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-white
            prose-blockquote:border-blue-500 prose-blockquote:text-white/50
            prose-img:rounded-xl prose-img:border prose-img:border-white/[0.07]
            prose-hr:border-white/10"
          dangerouslySetInnerHTML={{ __html: article.body }}
        />
      )}
    </div>
  );
}
