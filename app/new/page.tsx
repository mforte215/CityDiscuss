"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { RichTextEditor } from "@/components/rich-text-editor";

type PostType = "text" | "photo" | "video";
type City = { name: string; slug: string; state: string };

const TABS: { value: PostType; label: string; icon: string }[] = [
  { value: "text", label: "Text", icon: "✏️" },
  { value: "photo", label: "Photo", icon: "📷" },
  { value: "video", label: "Video", icon: "🎬" },
];

function isYouTube(url: string) {
  return /^https?:\/\/(www\.)?(youtube\.com\/watch|youtu\.be\/)/.test(url);
}

function NewPostPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cities, setCities] = useState<City[]>([]);
  const [citySlug, setCitySlug] = useState(searchParams.get("city") ?? "");
  const [postType, setPostType] = useState<PostType>("text");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("cities")
      .select("name, slug, state")
      .order("name")
      .then(({ data }) => {
        if (data) setCities(data);
      });
  }, []);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  const filled =
    citySlug &&
    title.trim() &&
    (postType === "photo"
      ? !!file
      : postType === "video"
        ? videoUrl.trim()
        : true);

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
      .eq("slug", citySlug)
      .single();

    if (!city) {
      setError("City not found.");
      setLoading(false);
      return;
    }

    let media_url: string | null = null;

    if (postType === "photo" && file) {
      if (file.size > 10 * 1024 * 1024) {
        setError("Image must be 10 MB or smaller.");
        setLoading(false);
        return;
      }
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
      const trimmed = videoUrl.trim();
      if (!isYouTube(trimmed)) {
        setError("Only YouTube links are supported (youtube.com/watch or youtu.be).");
        setLoading(false);
        return;
      }
      media_url = trimmed;
    }

    const { error: insertError } = await supabase.from("posts").insert({
      city_id: city.id,
      user_id: user.id,
      title: title.trim(),
      body: body.trim() || null,
      post_type: postType,
      media_url,
    });

    if (insertError) {
      setError(
        insertError.message.includes("row-level security")
          ? "You're posting too quickly — please wait a moment before posting again."
          : insertError.message,
      );
      setLoading(false);
      return;
    }

    router.push(`/city/${citySlug}`);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <button
        onClick={() => router.back()}
        className="mb-6 text-sm text-gray-400 hover:text-gray-600 dark:text-white/35 dark:hover:text-white/55"
      >
        ← Back
      </button>

      <h1 className="mb-6 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
        Start a discussion
      </h1>

      <div className="flex flex-col gap-4">
        {/* City selector */}
        <div>
          <label htmlFor="new-post-city" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-white/35">
            City
          </label>
          <select
            id="new-post-city"
            value={citySlug}
            onChange={(e) => setCitySlug(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500/50 dark:border-white/[0.08] dark:bg-[#0f0f0f] dark:text-white dark:focus:border-blue-500/30"
          >
            <option value="">Select a city...</option>
            {cities.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}, {c.state}
              </option>
            ))}
          </select>
        </div>

        {/* Post type tabs */}
        <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-white/[0.07] dark:bg-white/[0.03]">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setPostType(tab.value);
                setError("");
              }}
              aria-pressed={postType === tab.value}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition-colors ${
                postType === tab.value
                  ? "bg-white text-gray-900 shadow-sm dark:bg-white/[0.08] dark:text-white dark:shadow-none"
                  : "text-gray-400 hover:text-gray-600 dark:text-white/30 dark:hover:text-white/55"
              }`}
            >
              <span aria-hidden="true">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Title */}
        <div>
          <label htmlFor="new-post-title" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-white/35">
            Title
          </label>
          <input
            id="new-post-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-[15px] text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500/50 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:placeholder:text-white/20 dark:focus:border-blue-500/30"
          />
        </div>

        {/* Photo upload */}
        {postType === "photo" && (
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-white/35">
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
              <div className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.08]">
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
                className="flex w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-gray-300 bg-gray-50 py-10 text-sm text-gray-400 transition-colors hover:border-gray-400 hover:text-gray-600 dark:border-white/[0.12] dark:bg-white/[0.02] dark:text-white/30 dark:hover:border-white/20 dark:hover:text-white/50"
              >
                <span className="text-2xl">📷</span>
                <span>Click to choose a photo</span>
                <span className="text-xs text-gray-300 dark:text-white/20">Max 10 MB</span>
              </button>
            )}
          </div>
        )}

        {/* Video URL */}
        {postType === "video" && (
          <div>
            <label htmlFor="new-post-video-url" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-white/35">
              Video URL
            </label>
            <input
              id="new-post-video-url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-[15px] text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500/50 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:placeholder:text-white/20 dark:focus:border-blue-500/30"
            />
            {videoUrl && (
              <p className={`mt-1.5 text-xs ${isYouTube(videoUrl) ? "text-gray-400 dark:text-white/30" : "text-red-500 dark:text-red-400"}`}>
                {isYouTube(videoUrl) ? "YouTube link detected — will be embedded as a player." : "Only YouTube links are supported."}
              </p>
            )}
          </div>
        )}

        {/* Body */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-white/35">
            {postType === "text" ? "Details" : "Caption"}{" "}
            <span className="normal-case text-gray-300 dark:text-white/20">(optional)</span>
          </label>
          <RichTextEditor
            key={postType}
            content={body}
            onChange={setBody}
            placeholder={
              postType === "text"
                ? "Share more context, ask a question, or start a conversation…"
                : "Add a caption or description…"
            }
          />
        </div>

        {error && <p role="alert" className="text-sm text-red-500 dark:text-red-400">{error}</p>}

        <div className="flex justify-end gap-2.5">
          <button
            onClick={() => router.back()}
            className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm text-gray-500 hover:bg-gray-100 dark:border-white/10 dark:text-white/45 dark:hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!filled || loading}
            className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(59,130,246,0.2)] disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400 disabled:shadow-none dark:disabled:from-white/[0.06] dark:disabled:to-white/[0.06] dark:disabled:text-white/25"
          >
            {loading ? "Posting..." : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NewPostPage() {
  return (
    <Suspense>
      <NewPostPageContent />
    </Suspense>
  );
}
