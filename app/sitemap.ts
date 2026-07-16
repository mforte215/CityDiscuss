import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const BASE_URL = "https://www.citydiscuss.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const [{ data: articles }, { data: tags }] = await Promise.all([
    supabase
      .from("articles")
      .select("slug, published_at")
      .not("published_at", "is", null)
      .order("published_at", { ascending: false }),
    supabase.from("tags").select("slug"),
  ]);

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];

  // Published articles
  const articleRoutes: MetadataRoute.Sitemap = (articles ?? []).map(
    (article) => ({
      url: `${BASE_URL}/articles/${article.slug}`,
      lastModified: article.published_at ? new Date(article.published_at) : undefined,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }),
  );

  // Tag pages
  const tagRoutes: MetadataRoute.Sitemap = (tags ?? []).map((tag) => ({
    url: `${BASE_URL}/tags/${tag.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...articleRoutes, ...tagRoutes];
}
