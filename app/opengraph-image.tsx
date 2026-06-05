import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
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
        {/* Blue accent circle */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -120,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "rgba(59,130,246,0.12)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -80,
            left: -80,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "rgba(59,130,246,0.08)",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
            position: "relative",
          }}
        >
          <div
            style={{
              fontSize: "80px",
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-0.04em",
              lineHeight: 1,
            }}
          >
            CityDiscuss
          </div>
          <div
            style={{
              fontSize: "28px",
              color: "rgba(255,255,255,0.5)",
              letterSpacing: "-0.01em",
            }}
          >
            Your city. Your conversation.
          </div>
          <div
            style={{
              marginTop: "8px",
              display: "flex",
              gap: "12px",
            }}
          >
            <div
              style={{
                padding: "8px 20px",
                borderRadius: "999px",
                background: "rgba(59,130,246,0.25)",
                border: "1px solid rgba(59,130,246,0.4)",
                color: "#60a5fa",
                fontSize: "18px",
                fontWeight: 600,
              }}
            >
              Articles
            </div>
            <div
              style={{
                padding: "8px 20px",
                borderRadius: "999px",
                background: "rgba(59,130,246,0.25)",
                border: "1px solid rgba(59,130,246,0.4)",
                color: "#60a5fa",
                fontSize: "18px",
                fontWeight: 600,
              }}
            >
              Forum
            </div>
            <div
              style={{
                padding: "8px 20px",
                borderRadius: "999px",
                background: "rgba(59,130,246,0.25)",
                border: "1px solid rgba(59,130,246,0.4)",
                color: "#60a5fa",
                fontSize: "18px",
                fontWeight: 600,
              }}
            >
              Community
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
