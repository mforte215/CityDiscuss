import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;

  // Direct REST fetch — no cookies needed for public published articles
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/articles?slug=eq.${slug}&published_at=not.is.null&select=title,subtitle,cover_url&limit=1`,
    {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
      },
      next: { revalidate: 3600 },
    },
  );
  const [article] = await res.json().catch(() => [null]);

  const title = article?.title ?? "CityDiscuss";
  const subtitle = article?.subtitle ?? "";
  const coverUrl: string | null = article?.cover_url ?? null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#0f172a",
        }}
      >
        {/* Cover image as background */}
        {coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.45,
            }}
          />
        )}

        {/* Gradient overlay — stronger at bottom */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: coverUrl
              ? "linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.85) 70%, rgba(0,0,0,0.95) 100%)"
              : "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)",
          }}
        />

        {/* Content */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: "64px",
            height: "100%",
            gap: "0",
          }}
        >
          {/* Brand */}
          <div
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "#3b82f6",
              letterSpacing: "-0.01em",
              marginBottom: "20px",
            }}
          >
            CityDiscuss
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: title.length > 60 ? "50px" : "62px",
              fontWeight: 800,
              color: "#ffffff",
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              marginBottom: subtitle ? "16px" : "0",
            }}
          >
            {title.length > 80 ? title.slice(0, 80) + "…" : title}
          </div>

          {/* Subtitle */}
          {subtitle && (
            <div
              style={{
                fontSize: "24px",
                color: "rgba(255,255,255,0.55)",
                lineHeight: 1.4,
              }}
            >
              {subtitle.length > 110 ? subtitle.slice(0, 110) + "…" : subtitle}
            </div>
          )}
        </div>
      </div>
    ),
    size,
  );
}
