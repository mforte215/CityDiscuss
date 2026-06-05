"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/** Parse "X% Y%" → [x, y] as numbers. Falls back to 50 50 for "center". */
function parsePosition(pos: string): [number, number] {
  if (!pos || pos === "center") return [50, 50];
  const parts = pos.trim().split(/\s+/);
  const x = parseFloat(parts[0]) || 50;
  const y = parseFloat(parts[1] ?? parts[0]) || 50;
  return [x, y];
}

export function CoverUpload({
  userId,
  coverUrl,
  coverPosition,
  onCoverUrl,
  onCoverPosition,
}: {
  userId: string;
  coverUrl: string;
  coverPosition: string;
  onCoverUrl: (url: string) => void;
  onCoverPosition: (pos: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [dragging, setDragging] = useState(false);

  async function uploadFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setUploadError("Please upload an image file.");
      return;
    }
    setUploading(true);
    setUploadError("");

    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${userId}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("article-covers")
      .upload(path, file, { upsert: false });

    if (error) {
      setUploadError("Upload failed: " + error.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("article-covers")
      .getPublicUrl(path);

    onCoverUrl(urlData.publicUrl);
    onCoverPosition("50% 50%");
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  function handleFocalClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    onCoverPosition(`${x}% ${y}%`);
  }

  const [fx, fy] = parsePosition(coverPosition);

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileInput}
      />

      {coverUrl ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.07]">

          {/* ── Preview at hero aspect ratio ── */}
          <div
            className="relative aspect-[2.5/1] w-full cursor-crosshair overflow-hidden"
            onClick={handleFocalClick}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            title="Click to set focal point"
          >
            <img
              src={coverUrl}
              alt="Cover"
              className="pointer-events-none h-full w-full object-cover"
              style={{ objectPosition: coverPosition }}
              draggable={false}
            />

            {/* Focal point crosshair */}
            <div
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${fx}%`, top: `${fy}%` }}
            >
              {/* outer ring */}
              <div className="h-7 w-7 rounded-full border-2 border-white shadow-[0_0_0_1.5px_rgba(0,0,0,0.4)]" />
              {/* centre dot */}
              <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.4)]" />
              {/* crosshair lines */}
              <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/60" />
              <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-white/60" />
            </div>

            {/* Drag-to-replace overlay */}
            {dragging && (
              <div className="absolute inset-0 flex items-center justify-center bg-blue-500/40 backdrop-blur-sm">
                <p className="text-sm font-semibold text-white drop-shadow">Drop to replace</p>
              </div>
            )}
          </div>

          {/* ── Toolbar ── */}
          <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-3 py-2 dark:border-white/[0.07] dark:bg-white/[0.02]">
            <p className="text-xs text-gray-400 dark:text-white/30">
              Click image to reposition · focal point{" "}
              <span className="font-medium text-gray-600 dark:text-white/50">
                {fx}% {fy}%
              </span>
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="text-xs text-gray-400 hover:text-gray-700 disabled:opacity-50 dark:text-white/30 dark:hover:text-white/60"
              >
                Replace
              </button>
              <span className="text-gray-300 dark:text-white/15">·</span>
              <button
                type="button"
                onClick={() => { onCoverUrl(""); onCoverPosition("50% 50%"); }}
                className="text-xs text-red-400 hover:text-red-600 dark:hover:text-red-300"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ── Drop zone ── */
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          disabled={uploading}
          className={`flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-12 transition-colors disabled:opacity-60 ${
            dragging
              ? "border-blue-400 bg-blue-50 dark:border-blue-500/50 dark:bg-blue-500/[0.06]"
              : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100 dark:border-white/[0.08] dark:bg-white/[0.02] dark:hover:border-white/[0.15] dark:hover:bg-white/[0.04]"
          }`}
        >
          {uploading ? (
            <>
              <svg className="h-5 w-5 animate-spin text-blue-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span className="text-sm text-gray-500 dark:text-white/40">Uploading…</span>
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" className="h-7 w-7 text-gray-300 dark:text-white/20" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <path d="M3 15l5-5 4 4 3-3 6 6" />
                <circle cx="8.5" cy="8.5" r="1.5" />
              </svg>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600 dark:text-white/50">
                  Click to upload or drag & drop
                </p>
                <p className="mt-0.5 text-xs text-gray-400 dark:text-white/25">
                  PNG, JPG, WebP — any size
                </p>
              </div>
            </>
          )}
        </button>
      )}

      {uploadError && (
        <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">{uploadError}</p>
      )}
    </div>
  );
}
