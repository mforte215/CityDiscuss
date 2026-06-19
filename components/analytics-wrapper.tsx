"use client";

import { usePathname } from "next/navigation";
import { Analytics } from "@vercel/analytics/react";

export function AnalyticsWrapper() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  return <Analytics />;
}
