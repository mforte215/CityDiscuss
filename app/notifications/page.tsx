import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Notifications — CityDiscuss",
};

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function notificationText(n: any) {
  const actor = n.actor?.username ? `@${n.actor.username}` : "Someone";
  if (n.type === "comment") return `${actor} commented on your article`;
  if (n.type === "follow") return `${actor} started following you`;
  return "";
}

function notificationHref(n: any) {
  if (n.type === "follow") return n.actor?.username ? `/profile/${n.actor.username}` : "/notifications";
  if (n.article?.slug) return `/articles/${n.article.slug}`;
  return "/notifications";
}

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Legacy forum notifications (upvotes, post replies) are excluded — they
  // point at routes that no longer exist.
  const { data: notifications } = await (supabase as any)
    .from("notifications")
    .select("*, actor:profiles!actor_id(username, avatar_url), article:articles(title, slug)")
    .eq("user_id", user.id)
    .or("type.eq.follow,article_id.not.is.null")
    .order("created_at", { ascending: false })
    .limit(50);

  // Mark all as read
  await (supabase as any)
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false);

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
        Notifications
      </h1>

      {(!notifications || notifications.length === 0) ? (
        <p className="text-sm text-gray-400 dark:text-white/30">No notifications yet.</p>
      ) : (
        <div className="flex flex-col divide-y divide-gray-100 dark:divide-white/[0.05]">
          {notifications.map((n: any) => (
            <Link
              key={n.id}
              href={notificationHref(n)}
              className={`flex items-start gap-4 py-4 transition-colors first:pt-0 hover:opacity-80 ${
                !n.read ? "opacity-100" : "opacity-60"
              }`}
            >
              {!n.read && (
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
              )}
              <div className={!n.read ? "" : "ml-6"}>
                <p className="text-sm text-gray-800 dark:text-white/80">
                  {notificationText(n)}
                </p>
                {n.article && (
                  <p className="mt-1 line-clamp-1 text-xs text-gray-500 dark:text-white/40">
                    {n.article.title}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-400 dark:text-white/25">
                  {timeAgo(n.created_at)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
