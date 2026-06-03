"use client";

import { use, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type PostType = "text" | "photo" | "video";

const TABS: { value: PostType; label: string; icon: string }[] = [
  { value: "text", label: "Text", icon: "✏️" },
  { value: "photo", label: "Photo", icon: "📷" },
  { value: "video", label: "Video", icon: "🎬" },
];

function isYouTube(url: string) {
  return /youtube\.com|youtu\.be/.test(url);
}

export default function NewPostPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(props.params);
  const router = useRouter();
  const [postType, setPostType] = useState<PostType>("text");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  const filled =
    title.trim() &&
    (postType === "text"
      ? body.trim()
      : postType === "photo"
        ? !!file
        : videoUrl.trim());

  async function handleSubmit() {
    if (!filled) return;
    setLoading(true);
    setError("");

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("You must be logged in to post.");
      setLoading(false);
      return;
    }

    const { data: city } = await supabase
      .from("cities")
      .select("id")
      .eq("slug", slug)
      .single();

    if (!city) {
      setError("City not found.");
      setLoading(false);
      return;
    }

    let media_url: string | null = null;

    if (postType === "photo" && file) {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(path, file, { upsert: false });

      if (uploadError) {
        setError("Upload failed: " + uploadError.message);
        setLoading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("media")
        .getPublicUrl(path);
      media_url = urlData.publicUrl;
    } else if (postType === "video") {
      media_url = videoUrl.trim();
    }

    const { error: insertError } = await supabase.from("posts").insert({
      city_id: city.id,
      user_id: user.id,
      title: title.trim(),
      body: postType === "text" ? body.trim() : null,
      post_type: postType,
      media_url,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    router.push(`/city/${slug}`);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <button
        onClick={() => router.back()}
        className="mb-6 text-sm text-white/35 hover:text-white/55"
      >
        ← Back
      </button>

      <h2 className="mb-6 text-2xl font-bold tracking-tight">
        Start a discussion
      </h2>

      {/* Post type tabs */}
      <div className="mb-5 flex gap-1 rounded-xl border border-white/[0.07] bg-white/[0.03] p-1">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setPostType(tab.value);
              setError("");
            }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition-colors ${
              postType === tab.value
                ? "bg-white/[0.08] text-white"
                : "text-white/30 hover:text-white/55"
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {/* Title */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/35">
            Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-[15px] text-white outline-none placeholder:text-white/20 focus:border-blue-500/30"
          />
        </div>

        {/* Text body */}
        {postType === "text" && (
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/35">
              Details
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Share more context, ask a question, or start a conversation..."
              rows={6}
              className="w-full resize-y rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm leading-relaxed text-white outline-none placeholder:text-white/20 focus:border-blue-500/30"
            />
          </div>
        )}

        {/* Photo upload */}
        {postType === "photo" && (
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/35">
              Photo
            </label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFile}
              className="hidden"
            />
            {preview ? (
              <div className="relative overflow-hidden rounded-xl border border-white/[0.08]">
                <img
                  src={preview}
                  alt="Preview"
                  className="max-h-72 w-full object-cover"
                />
                <button
                  onClick={() => {
                    setFile(null);
                    setPreview(null);
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                  className="absolute right-2 top-2 rounded-lg bg-black/60 px-2 py-1 text-xs text-white/70 hover:text-white"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/[0.12] bg-white/[0.02] py-10 text-sm text-white/30 transition-colors hover:border-white/20 hover:text-white/50"
              >
                <span className="text-2xl">📷</span>
                Click to choose a photo
              </button>
            )}
          </div>
        )}

        {/* Video URL */}
        {postType === "video" && (
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/35">
              Video URL
            </label>
            <input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=... or direct video URL"
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-[15px] text-white outline-none placeholder:text-white/20 focus:border-blue-500/30"
            />
            {videoUrl && isYouTube(videoUrl) && (
              <p className="mt-1.5 text-xs text-white/30">
                YouTube link detected — will be embedded as a player.
              </p>
            )}
          </div>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex justify-end gap-2.5">
          <button
            onClick={() => router.back()}
            className="rounded-xl border border-white/10 px-5 py-2.5 text-sm text-white/45 hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!filled || loading}
            className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(59,130,246,0.2)] disabled:from-white/[0.06] disabled:to-white/[0.06] disabled:text-white/25 disabled:shadow-none"
          >
            {loading ? "Posting..." : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
}
