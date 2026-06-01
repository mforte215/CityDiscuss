import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import { NavAuth } from "@/components/nav-auth";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CityDiscuss — Your city. Your conversation.",
  description:
    "Real discussions about the places you live. No algorithms, no noise.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={geist.className}>
      <body>
        <nav className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-white/[0.06] bg-[rgba(10,10,14,0.85)] px-6 backdrop-blur-xl">
          <Link
            href="/"
            className="bg-gradient-to-br from-blue-400 to-blue-500 bg-clip-text text-lg font-bold tracking-tight text-transparent"
          >
            CityDiscuss
          </Link>
          <NavAuth />
        </nav>
        <main className="min-h-[calc(100vh-3.5rem)]">{children}</main>
      </body>
    </html>
  );
}
