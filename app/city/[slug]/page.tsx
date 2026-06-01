import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function Avatar({ username }: { username: string }) {
  const colors = ["#2563eb", "#7c3aed", "#0891b2", "#059669", "#d97706"];
  const idx = username.charCodeAt(0) % colors.length;
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
      style={{ width: 36, height: 36, background: colors[idx] }}
    >
      {username.slice(0, 2).toUpperCase()}
    </div>
  );
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default async function CityPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const supabase = await createClient();

  const { data: city } = await supabase
    .from("cities")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!city) notFound();

  const { data: posts } = await supabase
    .from("posts")
    .select("*, profiles(username), comments(count)")
    .eq("city_id", city.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <Link
            href="/"
            className="mb-2 inline-block text-xs text-white/30 hover:text-white/50"
          >
            ← All cities
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {city.name}
          </h1>
          <p className="mt-1 text-sm text-white/30">
            {posts?.length || 0} discussions · {city.state}
          </p>
        </div>
        <Link
          href={`/city/${slug}/new`}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 px-5 py-2.5 text-sm font-semibold shadow-[0_0_24px_rgba(59,130,246,0.25)]"
        >
          <span className="text-base font-normal">+</span> New post
        </Link>
      </div>

      <div className="flex flex-col gap-0.5">
        {posts?.map((post: any) => {
          const username = post.profiles?.username || "anonymous";
          const commentCount = post.comments?.[0]?.count || 0;

          return (
            <Link
              key={post.id}
              href={`/city/${slug}/${post.id}`}
              className="group block rounded-2xl border border-white/5 bg-white/[0.02] px-5 py-4 transition-all hover:border-white/10 hover:bg-white/[0.04]"
            >
              <div className="flex gap-3.5">
                <Avatar username={username} />
                <div className="min-w-0 flex-1">
                  <h3 className="text-[15px] font-semibold leading-snug tracking-[-0.01em]">
                    {post.title}
                  </h3>
                  <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-white/40">
                    {post.body}
                  </p>
                  <div className="mt-2.5 flex gap-4 text-xs text-white/25">
                    <span className="font-medium text-white/45">
                      @{username}
                    </span>
                    <span>{timeAgo(post.created_at)}</span>
                    <span>💬 {commentCount}</span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}

        {(!posts || posts.length === 0) && (
          <div className="py-20 text-center text-sm text-white/25">
            No discussions yet — be the first to post!
          </div>
        )}
      </div>
    </div>
  );
}
