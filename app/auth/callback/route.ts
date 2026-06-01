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
          const username =
            googleName.toLowerCase().replace(/\s+/g, "_") ||
            email.split("@")[0];

          await supabase.from("profiles").insert({
            id: user.id,
            username: username,
            display_name: googleName || username,
            avatar_url: user.user_metadata?.avatar_url || null,
          });
        }
      }

      return NextResponse.redirect(`${origin}/`);
    }
  }

  // If something went wrong, redirect to login with error
  return NextResponse.redirect(`${origin}/auth/login`);
}
