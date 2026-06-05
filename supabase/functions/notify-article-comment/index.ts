// Triggered by a Database Webhook on INSERT to the `article_comments` table.
// Sends an email to the article author when someone comments on their article.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://www.citydiscuss.com";
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "CityDiscuss <notifications@citydiscuss.com>";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function emailHtml({
  commenterUsername,
  articleTitle,
  articleSlug,
  commentBody,
}: {
  commenterUsername: string;
  articleTitle: string;
  articleSlug: string;
  commentBody: string;
}) {
  const articleUrl = `${SITE_URL}/articles/${articleSlug}`;
  const preview = commentBody.slice(0, 200);

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1d4ed8,#3b82f6);padding:28px 32px">
      <p style="margin:0;font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.02em">CityDiscuss</p>
      <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.7)">Article Notification</p>
    </div>

    <!-- Body -->
    <div style="padding:32px">
      <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em">New Comment</p>
      <h2 style="margin:0 0 20px;font-size:22px;font-weight:800;color:#111827;letter-spacing:-0.02em;line-height:1.3">
        @${commenterUsername} commented on your article
      </h2>

      <!-- Article reference -->
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:14px 16px;margin-bottom:20px">
        <p style="margin:0;font-size:12px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:0.05em">Your article</p>
        <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#374151">${articleTitle}</p>
      </div>

      <!-- Comment preview -->
      <div style="border-left:3px solid #3b82f6;padding:10px 16px;margin-bottom:28px;background:#eff6ff;border-radius:0 8px 8px 0">
        <p style="margin:0;font-size:14px;color:#1e40af;line-height:1.6">"${preview}${preview.length >= 200 ? "…" : ""}"</p>
      </div>

      <a href="${articleUrl}" style="display:inline-block;background:linear-gradient(135deg,#1d4ed8,#3b82f6);color:#ffffff;text-decoration:none;padding:13px 24px;border-radius:10px;font-size:14px;font-weight:700;letter-spacing:-0.01em">
        Read the comments →
      </a>
    </div>

    <!-- Footer -->
    <div style="padding:20px 32px;border-top:1px solid #f3f4f6">
      <p style="margin:0;font-size:12px;color:#9ca3af">
        You received this because you published an article on CityDiscuss.<br>
        <a href="${SITE_URL}/settings" style="color:#6b7280">Manage notifications</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const comment = payload.record;

    if (!comment?.article_id || !comment?.user_id || !comment?.body) {
      return new Response("Missing fields", { status: 400 });
    }

    // Fetch article + author
    const { data: article } = await supabase
      .from("articles")
      .select("title, slug, author_id")
      .eq("id", comment.article_id)
      .single();

    if (!article) return new Response("Article not found", { status: 404 });

    // Don't notify if commenter is the article author
    if (comment.user_id === article.author_id) {
      return new Response("Self-comment — skipped", { status: 200 });
    }

    // Get article author's email
    const { data: authorData } = await supabase.auth.admin.getUserById(article.author_id);
    const authorEmail = authorData?.user?.email;
    if (!authorEmail) return new Response("No author email", { status: 200 });

    // Get commenter's username
    const { data: commenterProfile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", comment.user_id)
      .single();

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: authorEmail,
        subject: `@${commenterProfile?.username ?? "Someone"} commented on "${article.title}"`,
        html: emailHtml({
          commenterUsername: commenterProfile?.username ?? "Someone",
          articleTitle: article.title,
          articleSlug: article.slug,
          commentBody: comment.body,
        }),
      }),
    });

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response("Error", { status: 500 });
  }
});
