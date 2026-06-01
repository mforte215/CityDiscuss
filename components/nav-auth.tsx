"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function NavAuth() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return <div className="h-8 w-20" />;
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-white/50">
          {user.user_metadata?.username ||
            user.user_metadata?.full_name ||
            user.email?.split("@")[0]}
        </span>
        <button
          onClick={handleLogout}
          className="rounded-lg border border-white/10 px-4 py-1.5 text-sm text-white/70 hover:bg-white/5"
        >
          Log out
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Link
        href="/auth/login"
        className="rounded-lg border border-white/10 px-4 py-1.5 text-sm text-white/70 hover:bg-white/5"
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
