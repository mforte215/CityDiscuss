"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Notification = {
  id: string;
  type: "comment" | "follow";
  read: boolean;
  created_at: string;
  actor: { username: string } | null;
  article: { title: string; slug: string } | null;
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

function notificationText(n: Notification) {
  const actor = n.actor?.username ? `@${n.actor.username}` : "Someone";
  if (n.type === "comment") return `${actor} commented on your article`;
  if (n.type === "follow") return `${actor} started following you`;
  return "";
}

function notificationHref(n: Notification) {
  if (n.type === "follow") return `/${n.actor?.username ? `profile/${n.actor.username}` : "notifications"}`;
  if (n.article?.slug) return `/articles/${n.article.slug}`;
  return "/notifications";
}

export function NotificationBell({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      // Legacy forum notifications are excluded — their routes are gone.
      const { data } = await (supabase as any)
        .from("notifications")
        .select("*, actor:profiles!actor_id(username), article:articles(title, slug)")
        .eq("user_id", userId)
        .or("type.eq.follow,article_id.not.is.null")
        .order("created_at", { ascending: false })
        .limit(20);

      if (data) {
        setNotifications(data);
        setUnread(data.filter((n: Notification) => !n.read).length);
      }
    }

    load();

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      }, async (payload) => {
        const { data } = await (supabase as any)
          .from("notifications")
          .select("*, actor:profiles!actor_id(username), article:articles(title, slug)")
          .eq("id", payload.new.id)
          .single();
        if (data) {
          setNotifications((prev) => [data, ...prev]);
          setUnread((n) => n + 1);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function markAllRead() {
    setUnread(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await fetch("/api/notifications/read", { method: "POST" });
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ""}`}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:text-white/35 dark:hover:bg-white/[0.06] dark:hover:text-white/70"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-80 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-white/[0.08] dark:bg-[#0f0f13]">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-white/[0.06]">
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/30">
              Notifications
            </span>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-400 dark:text-white/25">
                No notifications yet.
              </p>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.id}
                  href={notificationHref(n)}
                  onClick={() => setOpen(false)}
                  className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03] ${
                    !n.read ? "bg-blue-50/50 dark:bg-blue-500/[0.04]" : ""
                  }`}
                >
                  {!n.read && (
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                  )}
                  <div className={!n.read ? "" : "ml-4"}>
                    <p className="text-sm text-gray-700 dark:text-white/70">
                      {notificationText(n)}
                    </p>
                    {n.article && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-gray-400 dark:text-white/30">
                        {n.article.title}
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-gray-300 dark:text-white/20">
                      {timeAgo(n.created_at)}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>

          <div className="border-t border-gray-100 px-4 py-2 dark:border-white/[0.06]">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block text-center text-xs text-gray-400 hover:text-gray-600 dark:text-white/25 dark:hover:text-white/50"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
