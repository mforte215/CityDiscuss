"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function NavAuth() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .single();
        setUsername(profile?.username ?? null);
      }

      setLoading(false);
    }

    load();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (!session?.user) setUsername(null);
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setUsername(null);
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return <div className="h-8 w-20" />;
  }

  const forumLink = (
    <Link
      href="/forum"
      className="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-white/40 dark:hover:bg-white/[0.06] dark:hover:text-white/70"
    >
      Forum
    </Link>
  );

  const searchLink = (
    <Link
      href="/search"
      aria-label="Search"
      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:text-white/35 dark:hover:bg-white/[0.06] dark:hover:text-white/70"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    </Link>
  );

  if (user) {
    const displayName =
      username ??
      user.user_metadata?.username ??
      user.user_metadata?.full_name ??
      user.email?.split("@")[0];

    return (
      <div className="flex items-center gap-1">
        {forumLink}
        {searchLink}
        <Link
          href={`/profile/${displayName}`}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-white/70 dark:hover:bg-white/[0.06]"
        >
          @{displayName}
        </Link>
        <Link
          href="/settings"
          aria-label="Settings"
          className="relative flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:text-white/35 dark:hover:bg-white/[0.06] dark:hover:text-white/70"
        >
          {!username && (
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-amber-400" />
          )}
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </Link>
        <button
          onClick={handleLogout}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 dark:border-white/10 dark:text-white/60 dark:hover:bg-white/5"
        >
          Log out
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {forumLink}
      {searchLink}
      <Link
        href="/auth/login"
        className="rounded-lg border border-gray-200 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-100 dark:border-white/10 dark:text-white/70 dark:hover:bg-white/5"
      >
        Log in
      </Link>
      <Link
        href="/auth/signup"
        className="rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 px-4 py-1.5 text-sm font-semibold text-white"
      >
        Sign up
      </Link>
    </div>
  );
}
