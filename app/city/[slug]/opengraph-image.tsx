import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/cities?slug=eq.${slug}&select=name,state&limit=1`,
    {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
      },
      next: { revalidate: 3600 },
    },
  );
  const [city] = await res.json().catch(() => [null]);
  const name = city?.name ?? "City Forum";
  const state = city?.state ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)",
          position: "relative",
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            top: -100,
            right: -100,
            width: 480,
            height: 480,
            borderRadius: "50%",
            background: "rgba(59,130,246,0.1)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -60,
            left: -60,
            width: 280,
            height: 280,
            borderRadius: "50%",
            background: "rgba(59,130,246,0.07)",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
            position: "relative",
          }}
        >
          <div
            style={{
              fontSize: "20px",
              fontWeight: 600,
              color: "#3b82f6",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            CityDiscuss
          </div>
          <div
            style={{
              fontSize: name.length > 16 ? "72px" : "88px",
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-0.04em",
              lineHeight: 1,
              textAlign: "center",
            }}
          >
            {name}
          </div>
          {state && (
            <div
              style={{
                fontSize: "28px",
                color: "rgba(255,255,255,0.4)",
                letterSpacing: "0.02em",
              }}
            >
              {state}
            </div>
          )}
          <div
            style={{
              marginTop: "16px",
              padding: "10px 24px",
              borderRadius: "999px",
              border: "1px solid rgba(59,130,246,0.4)",
              background: "rgba(59,130,246,0.15)",
              color: "#93c5fd",
              fontSize: "20px",
              fontWeight: 600,
            }}
          >
            Local Forum & Discussions
          </div>
        </div>
      </div>
    ),
    size,
  );
}
