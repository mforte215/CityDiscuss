import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import { NavAuth } from "@/components/nav-auth";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CityDiscuss — Your city. Your conversation.",
  description:
    "Real discussions about the places you live. No algorithms, no noise.",
  icons: {
    icon: "/logo.png",
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
        </ThemeProvider>
      </body>
    </html>
  );
}
