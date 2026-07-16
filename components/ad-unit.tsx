"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";

interface AdUnitProps {
  slot: string;
  format?: "auto" | "rectangle" | "horizontal" | "vertical";
  className?: string;
}

// Routes that must never serve ads (auth, utility, and admin screens). AdUnit
// isn't placed on any of these today — this is a safeguard so that dropping one
// in by accident can't trip the AdSense "ads without publisher-content" policy.
const NO_AD_PREFIXES = ["/admin", "/auth", "/settings", "/account", "/notifications"];

export function AdUnit({ slot, format = "auto", className }: AdUnitProps) {
  const pathname = usePathname();
  const suppressed = NO_AD_PREFIXES.some((p) => pathname?.startsWith(p));

  useEffect(() => {
    if (suppressed) return;
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch {}
  }, [suppressed]);

  if (suppressed) return null;

  return (
    <div className={className}>
      {/* Loaded here rather than in the root layout so the AdSense script is
          absent from pages that serve no ads (auth, settings, admin, search).
          next/script dedupes by id when a page renders several units. */}
      <Script
        id="adsbygoogle-js"
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3091085842217794"
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-3091085842217794"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
