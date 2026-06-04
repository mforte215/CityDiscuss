import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import { NewPostPicker } from "@/components/new-post-picker";

function Avatar({ username }: { username: string }) {
  const colors = ["#2563eb", "#7c3aed", "#0891b2", "#059669", "#d97706"];
  const idx = username.charCodeAt(0) % colors.length;
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
      style={{ width: 32, height: 32, background: colors[idx] }}
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

export default async function Home() {
  const supabase = await createClient();

  const [{ data: posts }, { data: cities }] = await Promise.all([
    supabase
      .from("posts")
      .select("*, profiles(username), comments(count), cities(name, slug)")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("cities").select("name, slug, state").order("name"),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Image
            src="/logo.png"
            alt="CityDiscuss"
            width={48}
            height={48}
            className="rounded-xl"
          />
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              CityDiscuss
            </h1>
            <p className="text-sm text-white/35">
              Latest posts from every city
            </p>
          </div>
        </div>
        <NewPostPicker cities={cities ?? []} />
      </div>

      <div className="flex flex-col gap-0.5">
        {posts?.map((post: any) => {
          const username = post.profiles?.username || "anonymous";
          const commentCount = post.comments?.[0]?.count || 0;
          const city = post.cities;

          return (
            <div
              key={post.id}
              className="group relative rounded-2xl border border-white/5 bg-white/[0.02] px-5 py-4 transition-all hover:border-white/10 hover:bg-white/[0.04]"
            >
              <Link
                href={`/city/${city?.slug}/${post.id}`}
                className="absolute inset-0 rounded-2xl"
                aria-label={post.title}
              />
              <div className="relative flex gap-3 pointer-events-none">
                {post.post_type === "photo" && post.media_url ? (
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-white/[0.07]">
                    <img
                      src={post.media_url}
                      alt={post.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <Avatar username={username} />
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <h3 className="text-[15px] font-semibold leading-snug tracking-[-0.01em]">
                      {post.title}
                    </h3>
                    {post.post_type !== "text" && (
                      <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/30 ring-1 ring-white/10">
                        {post.post_type}
                      </span>
                    )}
                  </div>

                  {post.body && (
                    <p className="mt-1 line-clamp-1 text-sm text-white/35">
                      {post.body}
                    </p>
                  )}

                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-white/25">
                    {city && (
                      <span className="font-medium text-blue-400/70">
                        {city.name}
                      </span>
                    )}
                    <Link
                      href={`/profile/${username}`}
                      className="relative pointer-events-auto text-white/40 hover:text-blue-400"
                    >
                      @{username}
                    </Link>
                    <span>{timeAgo(post.created_at)}</span>
                    <span>💬 {commentCount}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {(!posts || posts.length === 0) && (
          <div className="py-20 text-center text-sm text-white/25">
            No posts yet. Be the first to start a discussion!
          </div>
        )}
      </div>

      <div className="mt-8 border-t border-white/[0.05] pt-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/25">
          Browse by city
        </p>
        <div className="flex flex-wrap gap-2">
          {cities?.map((city) => (
            <Link
              key={city.slug}
              href={`/city/${city.slug}`}
              className="rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-1.5 text-sm text-white/45 transition-colors hover:border-white/15 hover:text-white/70"
            >
              {city.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
