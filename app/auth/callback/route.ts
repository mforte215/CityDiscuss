import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if the user has a profile — Google users won't have one yet
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .single();

        // If no profile exists (Google sign-in), create one
        if (!profile) {
          const email = user.email || "";
          const googleName =
            user.user_metadata?.full_name || user.user_metadata?.name || "";
          const baseUsername =
            googleName.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "") ||
            email.split("@")[0];

          // Retry with a random suffix on username collision
          let username = baseUsername;
          let inserted = false;
          for (let attempt = 0; attempt < 5; attempt++) {
            const { error: insertError } = await supabase.from("profiles").insert({
              id: user.id,
              username,
              display_name: googleName || username,
              avatar_url: user.user_metadata?.avatar_url || null,
            });
            if (!insertError) { inserted = true; break; }
            if (insertError.code === "23505") {
              // unique violation — try a new suffix
              username = `${baseUsername}_${Math.floor(1000 + Math.random() * 9000)}`;
            } else {
              break;
            }
          }

          if (!inserted) {
            return NextResponse.redirect(`${origin}/auth/login`);
          }
        }
      }

      return NextResponse.redirect(`${origin}/`);
    }
  }

  // If something went wrong, redirect to login with error
  return NextResponse.redirect(`${origin}/auth/login`);
}
