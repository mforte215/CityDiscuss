import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { newPostApiSchema } from "@/lib/schemas";
import { postLimiter, checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "127.0.0.1";
  const { limited } = await checkRateLimit(postLimiter, `post:${ip}`);
  if (limited) {
    return NextResponse.json(
      { error: "You're posting too quickly — please wait a moment." },
      { status: 429 },
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in to post." }, { status: 401 });
  }

  const body = await request.json();
  const result = newPostApiSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  const { citySlug, title, postType, body: postBody, mediaUrl } = result.data;

  const { data: city } = await supabase
    .from("cities")
    .select("id")
    .eq("slug", citySlug)
    .single();

  if (!city) {
    return NextResponse.json({ error: "City not found." }, { status: 404 });
  }

  const { error } = await supabase.from("posts").insert({
    city_id: city.id,
    user_id: user.id,
    title: title.trim(),
    body: postBody?.trim() || null,
    post_type: postType,
    media_url: mediaUrl ?? null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
