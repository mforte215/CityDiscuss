import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image(props: {
  params: Promise<{ slug: string; postId: string }>;
}) {
  const { postId, slug } = await props.params;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/posts?id=eq.${postId}&select=title,body,post_type,media_url,profiles(username),cities(name,state)&limit=1`,
    {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
      },
      next: { revalidate: 3600 },
    },
  );
  const [post] = await res.json().catch(() => [null]);

  const title = post?.title ?? "Community Discussion";
  const author = post?.profiles?.username ?? null;
  const cityName = post?.cities?.name ?? null;
  const cityState = post?.cities?.state ?? null;
  const photoUrl =
    post?.post_type === "photo" && post?.media_url ? post.media_url : null;

  // Truncate title for display
  const displayTitle = title.length > 80 ? title.slice(0, 77) + "…" : title;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background photo (photo posts only) */}
        {photoUrl && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
            }}
          >
            <img
              src={photoUrl}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: 0.25,
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to right, rgba(15,23,42,0.95) 50%, rgba(15,23,42,0.6) 100%)",
                display: "flex",
              }}
            />
          </div>
        )}

        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            top: -140,
            right: -140,
            width: 520,
            height: 520,
            borderRadius: "50%",
            background: "rgba(59,130,246,0.08)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -80,
            left: -80,
            width: 320,
            height: 320,
            borderRadius: "50%",
            background: "rgba(59,130,246,0.06)",
            display: "flex",
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "64px 72px",
            width: "100%",
            position: "relative",
          }}
        >
          {/* Top: brand + city */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                fontSize: "22px",
                fontWeight: 700,
                color: "#3b82f6",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              CityDiscuss
            </div>
            {cityName && (
              <>
                <div
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.2)",
                    display: "flex",
                  }}
                />
                <div
                  style={{
                    fontSize: "20px",
                    color: "rgba(255,255,255,0.45)",
                    fontWeight: 500,
                  }}
                >
                  {cityName}
                  {cityState ? `, ${cityState}` : ""}
                </div>
              </>
            )}
          </div>

          {/* Middle: post title */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              flex: 1,
              justifyContent: "center",
              paddingTop: "32px",
              paddingBottom: "32px",
            }}
          >
            <div
              style={{
                fontSize: displayTitle.length > 50 ? "52px" : "64px",
                fontWeight: 800,
                color: "#ffffff",
                letterSpacing: "-0.03em",
                lineHeight: 1.15,
                maxWidth: "900px",
              }}
            >
              {displayTitle}
            </div>
          </div>

          {/* Bottom: author + forum label */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {author ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "#fff",
                  }}
                >
                  {author[0].toUpperCase()}
                </div>
                <div
                  style={{
                    fontSize: "20px",
                    color: "rgba(255,255,255,0.55)",
                    fontWeight: 500,
                  }}
                >
                  @{author}
                </div>
              </div>
            ) : (
              <div />
            )}

            <div
              style={{
                padding: "10px 22px",
                borderRadius: "999px",
                border: "1px solid rgba(59,130,246,0.4)",
                background: "rgba(59,130,246,0.12)",
                color: "#93c5fd",
                fontSize: "18px",
                fontWeight: 600,
                display: "flex",
              }}
            >
              💬 Join the discussion
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
