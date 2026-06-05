"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Tag = { id: string; name: string; slug: string };

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function AdminTagsPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [tags, setTags] = useState<Tag[]>([]);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push("/auth/login"); return; }
      const { data: profile } = await supabase
        .from("profiles").select("is_admin").eq("id", user.id).single();
      if (!profile?.is_admin) { router.push("/"); return; }

      const { data } = await supabase
        .from("tags").select("id, name, slug").order("name");
      if (data) setTags(data);
      setChecking(false);
    });
  }, [router]);

  async function handleCreate() {
    if (!newName.trim()) return;
    setSaving(true);
    setError("");
    const supabase = createClient();
    const capitalized = newName.trim().replace(/\b\w/g, (c) => c.toUpperCase());
    const { data, error: insertError } = await supabase
      .from("tags")
      .insert({ name: capitalized, slug: slugify(newName.trim()) })
      .select()
      .single();
    if (insertError) {
      setError(insertError.message);
    } else if (data) {
      setTags((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName("");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this tag? It will be removed from all articles.")) return;
    const supabase = createClient();
    await supabase.from("tags").delete().eq("id", id);
    setTags((prev) => prev.filter((t) => t.id !== id));
  }

  if (checking) {
    return <div className="mx-auto max-w-2xl px-6 py-20 text-sm text-gray-400 dark:text-white/30">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-8 flex items-center gap-3">
        <Link href="/admin" className="text-sm text-gray-400 hover:text-gray-700 dark:text-white/30 dark:hover:text-white/60">
          ← Dashboard
        </Link>
        <span className="text-gray-300 dark:text-white/15">/</span>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Tags</h1>
      </div>

      {/* Create new tag */}
      <div className="mb-8 rounded-xl border border-gray-200 bg-gray-50 px-5 py-5 dark:border-white/[0.07] dark:bg-white/[0.02]">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-white/35">
          New tag
        </p>
        <div className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="e.g. Politics, Development, Events…"
            className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500/50 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:placeholder:text-white/20 dark:focus:border-blue-500/30"
          />
          <button
            onClick={handleCreate}
            disabled={!newName.trim() || saving}
            className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
          >
            {saving ? "Adding…" : "Add"}
          </button>
        </div>
        {newName && (
          <p className="mt-1.5 text-xs text-gray-400 dark:text-white/25">
            Will save as: <span className="font-medium text-gray-600 dark:text-white/50">{newName.trim().replace(/\b\w/g, (c) => c.toUpperCase())}</span>
            <span className="mx-1.5">·</span>
            Slug: <span className="font-mono">{slugify(newName)}</span>
          </p>
        )}
        {error && <p className="mt-2 text-sm text-red-500 dark:text-red-400">{error}</p>}
      </div>

      {/* Tag list */}
      {tags.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-white/30">No tags yet.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-white/[0.07] dark:bg-white/[0.02]"
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{tag.name}</p>
                <p className="text-xs text-gray-400 dark:text-white/25 font-mono">/tags/{tag.slug}</p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/tags/${tag.slug}`}
                  target="_blank"
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 dark:border-white/10 dark:text-white/40 dark:hover:bg-white/5"
                >
                  View
                </Link>
                <button
                  onClick={() => handleDelete(tag.id)}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-400 hover:bg-red-50 dark:border-red-500/20 dark:hover:bg-red-500/10"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
