import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { articleCommentApiSchema } from "@/lib/schemas";
import { commentLimiter, checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "127.0.0.1";
  const { limited } = await checkRateLimit(commentLimiter, `comment:${ip}`);
  if (limited) {
    return NextResponse.json(
      { error: "You're commenting too quickly — please wait a moment." },
      { status: 429 },
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in to comment." }, { status: 401 });
  }

  const body = await request.json();
  const result = articleCommentApiSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  const { articleId, body: commentBody } = result.data;

  const { error } = await supabase.from("article_comments").insert({
    article_id: articleId,
    user_id: user.id,
    body: commentBody.trim(),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
