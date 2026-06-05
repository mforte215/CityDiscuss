import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import { NavAuth } from "@/components/nav-auth";
import { ThemeProvider } from "@/components/theme-provider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CityDiscuss — Your city. Your conversation.",
  description:
    "Real discussions about the places you live. No algorithms, no noise.",
  icons: {
    // favicon.ico in app/ is auto-detected — no entry needed
    // apple-icon.png in app/ is auto-detected — no entry needed
    // Fallback for browsers that don't pick up the file-based icons
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={geist.className} suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <nav className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-black/[0.07] bg-white/85 px-6 backdrop-blur-xl dark:border-white/[0.06] dark:bg-[rgba(10,10,14,0.85)]">
            <Link href="/" className="flex items-center gap-2">
              {/* Light logo */}
              <Image
                src="/logo.png"
                alt="CityDiscuss"
                width={32}
                height={32}
                className="rounded-md block dark:hidden"
              />
              {/* Dark logo */}
              <Image
                src="/logo-dark.png"
                alt="CityDiscuss"
                width={32}
                height={32}
                className="rounded-md hidden dark:block"
              />
              <span className="bg-gradient-to-br from-blue-500 to-blue-600 bg-clip-text text-lg font-bold tracking-tight text-transparent">
                CityDiscuss
              </span>
            </Link>
            <NavAuth />
          </nav>
          <main className="min-h-[calc(100vh-3.5rem)]">{children}</main>

          <footer className="border-t border-black/[0.06] bg-gray-50 dark:border-white/[0.05] dark:bg-white/[0.01]">
            <div className="mx-auto max-w-5xl px-6 py-10">
              <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
                {/* Brand */}
                <div className="flex items-center gap-2.5">
                  <Image
                    src="/logo.png"
                    alt="CityDiscuss"
                    width={28}
                    height={28}
                    className="rounded-md block dark:hidden"
                  />
                  <Image
                    src="/logo-dark.png"
                    alt="CityDiscuss"
                    width={28}
                    height={28}
                    className="rounded-md hidden dark:block"
                  />
                  <span className="bg-gradient-to-br from-blue-500 to-blue-600 bg-clip-text font-bold tracking-tight text-transparent">
                    CityDiscuss
                  </span>
                </div>

                {/* Link columns */}
                <div className="flex flex-wrap gap-x-12 gap-y-6 text-sm">
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-white/25">
                      Explore
                    </p>
                    <Link href="/" className="text-gray-500 hover:text-gray-900 dark:text-white/40 dark:hover:text-white/70">
                      Articles
                    </Link>
                    <Link href="/forum" className="text-gray-500 hover:text-gray-900 dark:text-white/40 dark:hover:text-white/70">
                      Forum
                    </Link>
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-white/25">
                      Account
                    </p>
                    <Link href="/auth/login" className="text-gray-500 hover:text-gray-900 dark:text-white/40 dark:hover:text-white/70">
                      Log in
                    </Link>
                    <Link href="/auth/signup" className="text-gray-500 hover:text-gray-900 dark:text-white/40 dark:hover:text-white/70">
                      Sign up
                    </Link>
                    <Link href="/settings" className="text-gray-500 hover:text-gray-900 dark:text-white/40 dark:hover:text-white/70">
                      Settings
                    </Link>
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-white/25">
                      Legal
                    </p>
                    <Link href="/privacy" className="text-gray-500 hover:text-gray-900 dark:text-white/40 dark:hover:text-white/70">
                      Privacy Policy
                    </Link>
                    <Link href="/terms" className="text-gray-500 hover:text-gray-900 dark:text-white/40 dark:hover:text-white/70">
                      Terms of Service
                    </Link>
                  </div>
                </div>
              </div>

              {/* Bottom bar */}
              <div className="mt-8 border-t border-black/[0.05] pt-6 dark:border-white/[0.04]">
                <p className="text-xs text-gray-400 dark:text-white/25">
                  © {new Date().getFullYear()} CityDiscuss. Your city. Your conversation.
                </p>
              </div>
            </div>
          </footer>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
