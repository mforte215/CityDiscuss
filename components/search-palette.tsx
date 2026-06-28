"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Article = {
  slug: string;
  title: string;
  subtitle: string | null;
  cities: { name: string } | null;
};

type Post = {
  id: string;
  title: string;
  body: string | null;
  cities: { name: string; slug: string } | null;
  profiles: { username: string } | null;
};

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [articles, setArticles] = useState<Article[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setArticles([]);
      setPosts([]);
      setSelected(0);
    }
  }, [open]);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setArticles([]);
      setPosts([]);
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const useFts = q.trim().length >= 3;

    const [{ data: a }, { data: p }] = await Promise.all([
      useFts
        ? supabase
            .from("articles")
            .select("slug, title, subtitle, cities(name)")
            .or(`title.wfts(english).${q},subtitle.wfts(english).${q}`)
            .not("published_at", "is", null)
            .limit(4)
        : supabase
            .from("articles")
            .select("slug, title, subtitle, cities(name)")
            .ilike("title", `%${q}%`)
            .not("published_at", "is", null)
            .limit(4),
      useFts
        ? supabase
            .from("posts")
            .select("id, title, body, cities(name, slug), profiles(username)")
            .or(`title.wfts(english).${q},body.wfts(english).${q}`)
            .limit(6)
        : supabase
            .from("posts")
            .select("id, title, body, cities(name, slug), profiles(username)")
            .ilike("title", `%${q}%`)
            .limit(6),
    ]);

    setArticles((a as Article[]) ?? []);
    setPosts((p as Post[]) ?? []);
    setSelected(0);
    setLoading(false);
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 250);
  }

  const allResults: { href: string; label: string; sub: string }[] = [
    ...articles.map((a) => ({
      href: `/articles/${a.slug}`,
      label: a.title,
      sub: a.cities?.name ?? "Article",
    })),
    ...posts.map((p) => ({
      href: `/city/${p.cities?.slug}/${p.id}`,
      label: p.title,
      sub: p.cities?.name ?? p.profiles?.username ?? "Post",
    })),
  ];

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, allResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter" && allResults[selected]) {
      router.push(allResults[selected].href);
      onClose();
    }
  }

  const hasResults = allResults.length > 0;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[12vh]"
      onClick={() => onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm dark:bg-black/60" />

      {/* Panel */}
      <div
        className="relative z-10 w-full max-w-xl mx-4 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-white/[0.08] dark:bg-[#0f0f13]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input row */}
        <div className="flex items-center gap-3 border-b border-gray-100 px-4 dark:border-white/[0.06]">
          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-gray-400 dark:text-white/30" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Search posts and articles…"
            aria-label="Search"
            className="flex-1 bg-transparent py-4 text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-white dark:placeholder:text-white/25"
          />
          {loading && (
            <svg className="h-4 w-4 shrink-0 animate-spin text-gray-300 dark:text-white/20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={3} strokeDasharray="32" strokeDashoffset="12" />
            </svg>
          )}
          <kbd className="hidden shrink-0 rounded border border-gray-200 px-1.5 py-0.5 text-[10px] text-gray-400 sm:block dark:border-white/10 dark:text-white/25">
            ESC
          </kbd>
        </div>

        {/* Results */}
        {query && (
          <div className="max-h-[60vh] overflow-y-auto py-2">
            {!hasResults && !loading && (
              <p className="px-4 py-6 text-center text-sm text-gray-400 dark:text-white/25">
                No results for &ldquo;{query}&rdquo;
              </p>
            )}

            {articles.length > 0 && (
              <div>
                <p className="px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-white/25">
                  Articles
                </p>
                {articles.map((a, i) => (
                  <button
                    key={a.slug}
                    onClick={() => { router.push(`/articles/${a.slug}`); onClose(); }}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      selected === i ? "bg-blue-50 dark:bg-blue-500/[0.08]" : "hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                    }`}
                  >
                    <span className="text-xs text-gray-300 dark:text-white/20" aria-hidden="true">📄</span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{a.title}</p>
                      {a.cities?.name && (
                        <p className="text-xs text-gray-400 dark:text-white/30">{a.cities.name}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {posts.length > 0 && (
              <div>
                <p className="px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-white/25">
                  Forum posts
                </p>
                {posts.map((p, i) => {
                  const idx = articles.length + i;
                  return (
                    <button
                      key={p.id}
                      onClick={() => { router.push(`/city/${p.cities?.slug}/${p.id}`); onClose(); }}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        selected === idx ? "bg-blue-50 dark:bg-blue-500/[0.08]" : "hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                      }`}
                    >
                      <span className="text-xs text-gray-300 dark:text-white/20" aria-hidden="true">💬</span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{p.title}</p>
                        <p className="text-xs text-gray-400 dark:text-white/30">
                          {p.cities?.name}{p.profiles?.username ? ` · @${p.profiles.username}` : ""}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Footer hint */}
        {!query && (
          <div className="flex items-center gap-4 px-4 py-3 text-xs text-gray-300 dark:text-white/20">
            <span><kbd className="rounded border border-gray-200 px-1 dark:border-white/10">↑</kbd><kbd className="ml-1 rounded border border-gray-200 px-1 dark:border-white/10">↓</kbd> navigate</span>
            <span><kbd className="rounded border border-gray-200 px-1 dark:border-white/10">↵</kbd> open</span>
            <span><kbd className="rounded border border-gray-200 px-1 dark:border-white/10">ESC</kbd> close</span>
          </div>
        )}
      </div>
    </div>
  );
}
