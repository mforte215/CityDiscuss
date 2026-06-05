"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExtension from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import Typography from "@tiptap/extension-typography";
import { useCallback, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// ── Toolbar button ────────────────────────────────────────────────

function Btn({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault(); // prevent editor losing focus
        onClick();
      }}
      disabled={disabled}
      title={title}
      className={`flex h-7 w-7 items-center justify-center rounded text-sm transition-colors ${
        active
          ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-white/40 dark:hover:bg-white/[0.07] dark:hover:text-white/70"
      } disabled:opacity-30`}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div className="mx-0.5 h-5 w-px bg-gray-200 dark:bg-white/10" />;
}

// ── Link popover ──────────────────────────────────────────────────

function LinkPopover({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const isActive = editor.isActive("link");

  function apply() {
    if (!url.trim()) return;
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url.trim() })
      .run();
    setOpen(false);
    setUrl("");
  }

  function remove() {
    editor.chain().focus().unsetLink().run();
    setOpen(false);
  }

  return (
    <div className="relative">
      <Btn
        onClick={() => {
          setUrl(editor.getAttributes("link").href ?? "");
          setOpen((o) => !o);
        }}
        active={isActive}
        title="Link"
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      </Btn>
      {open && (
        <div className="absolute left-0 top-9 z-20 flex w-72 flex-col gap-2 rounded-xl border border-gray-200 bg-white p-3 shadow-lg dark:border-white/10 dark:bg-[#1a1a22]">
          <input
            autoFocus
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && apply()}
            placeholder="https://..."
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm outline-none focus:border-blue-500/50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/25"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={apply}
              className="flex-1 rounded-lg bg-blue-500 py-1.5 text-xs font-semibold text-white hover:bg-blue-600"
            >
              Apply
            </button>
            {isActive && (
              <button
                type="button"
                onClick={remove}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 dark:border-white/10 dark:text-white/40"
              >
                Remove
              </button>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 dark:border-white/10 dark:text-white/40"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Image popover ─────────────────────────────────────────────────

function ImagePopover({ editor, userId }: { editor: Editor; userId?: string }) {
  const canUpload = !!userId;
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState<"upload" | "url">(canUpload ? "upload" : "url");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File) {
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("article-images")
      .upload(path, file, { upsert: false });
    if (!error) {
      const { data: urlData } = supabase.storage
        .from("article-images")
        .getPublicUrl(path);
      editor.chain().focus().setImage({ src: urlData.publicUrl }).run();
      setOpen(false);
    }
    setUploading(false);
  }

  function insertUrl() {
    if (!url.trim()) return;
    editor.chain().focus().setImage({ src: url.trim() }).run();
    setUrl("");
    setOpen(false);
  }

  return (
    <div className="relative">
      <Btn onClick={() => setOpen((o) => !o)} title="Insert image">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <path d="M3 15l5-5 4 4 3-3 6 6" />
          <circle cx="8.5" cy="8.5" r="1.5" />
        </svg>
      </Btn>
      {open && (
        <div className="absolute left-0 top-9 z-20 w-72 rounded-xl border border-gray-200 bg-white shadow-lg dark:border-white/10 dark:bg-[#1a1a22]">
          {/* Tabs — only show Upload tab when userId is available */}
          {canUpload && (
            <div className="flex border-b border-gray-100 dark:border-white/[0.06]">
              {(["upload", "url"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`flex-1 py-2 text-xs font-medium transition-colors ${
                    tab === t
                      ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                      : "text-gray-400 hover:text-gray-700 dark:text-white/30"
                  }`}
                >
                  {t === "upload" ? "Upload" : "Insert URL"}
                </button>
              ))}
            </div>
          )}

          <div className="p-3">
            {tab === "upload" ? (
              <>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(f);
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-200 py-5 text-sm text-gray-400 hover:border-gray-300 hover:text-gray-600 disabled:opacity-50 dark:border-white/10 dark:text-white/30 dark:hover:border-white/20"
                >
                  {uploading ? "Uploading…" : "Click to choose image"}
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2">
                <input
                  autoFocus
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && insertUrl()}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm outline-none focus:border-blue-500/50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/25"
                />
                <button
                  type="button"
                  onClick={insertUrl}
                  className="w-full rounded-lg bg-blue-500 py-1.5 text-xs font-semibold text-white hover:bg-blue-600"
                >
                  Insert
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-2 top-2 rounded p-0.5 text-gray-400 hover:text-gray-700 dark:text-white/25 dark:hover:text-white/50"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

// ── Toolbar ───────────────────────────────────────────────────────

function Toolbar({ editor, userId }: { editor: Editor; userId?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 px-2 py-1.5 dark:border-white/[0.07]">
      {/* History */}
      <Btn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 7v6h6" /><path d="M3 13C4.5 7.5 10 4 16 5.5a9 9 0 0 1 5 7.5" />
        </svg>
      </Btn>
      <Btn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 7v6h-6" /><path d="M21 13C19.5 7.5 14 4 8 5.5a9 9 0 0 0-5 7.5" />
        </svg>
      </Btn>

      <Sep />

      {/* Inline formatting */}
      <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" /><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
        </svg>
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="4" x2="10" y2="4" /><line x1="14" y1="20" x2="5" y2="20" /><line x1="15" y1="4" x2="9" y2="20" />
        </svg>
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.3 12H6.7" /><path d="M8.25 7.75C8.25 5.68 9.93 4 12 4c2.07 0 3.75 1.68 3.75 3.75" /><path d="M8.25 16.25C8.25 18.32 9.93 20 12 20c2.07 0 3.75-1.68 3.75-3.75" />
        </svg>
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Inline code">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
        </svg>
      </Btn>

      <Sep />

      {/* Headings */}
      <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading 2">
        <span className="text-[11px] font-bold">H2</span>
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Heading 3">
        <span className="text-[11px] font-bold">H3</span>
      </Btn>

      <Sep />

      {/* Lists */}
      <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet list">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <line x1="9" y1="6" x2="20" y2="6" /><line x1="9" y1="12" x2="20" y2="12" /><line x1="9" y1="18" x2="20" y2="18" />
          <circle cx="4" cy="6" r="1" fill="currentColor" stroke="none" /><circle cx="4" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="4" cy="18" r="1" fill="currentColor" stroke="none" />
        </svg>
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered list">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <line x1="10" y1="6" x2="21" y2="6" /><line x1="10" y1="12" x2="21" y2="12" /><line x1="10" y1="18" x2="21" y2="18" />
          <path d="M4 6h1v4" /><path d="M4 10h2" /><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
        </svg>
      </Btn>

      <Sep />

      {/* Blocks */}
      <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Blockquote">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
          <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
          <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
        </svg>
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="Code block">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="18" rx="2" /><path d="m8 10-3 2 3 2" /><path d="m16 10 3 2-3 2" /><path d="m12.5 7-1 10" />
        </svg>
      </Btn>
      <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <line x1="3" y1="12" x2="21" y2="12" />
        </svg>
      </Btn>

      <Sep />

      {/* Link & Image */}
      <LinkPopover editor={editor} />
      <ImagePopover editor={editor} userId={userId} />
    </div>
  );
}

// ── Main editor ───────────────────────────────────────────────────

export function RichTextEditor({
  content,
  onChange,
  userId,
  placeholder = "Write here…",
}: {
  content: string;
  onChange: (html: string) => void;
  userId?: string;
  placeholder?: string;
}) {
  const [ready, setReady] = useState(false);

  const editor = useEditor({
    immediatelyRender: true,
    extensions: [
      // StarterKit v3 already includes Link — configure it here, don't add separately
      StarterKit.configure({
        link: {
          openOnClick: false,
          autolink: true,
        },
      }),
      Typography,
      Placeholder.configure({ placeholder }),
      CharacterCount,
      ImageExtension.configure({ inline: false }),
    ],
    content,
    onCreate: () => setReady(true),
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "focus:outline-none",
      },
    },
  });

  const wordCount = editor?.storage.characterCount?.words() ?? 0;
  const readMins = Math.max(1, Math.round(wordCount / 238));

  if (!editor) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.08] dark:bg-white/[0.02]">
      {ready && <Toolbar editor={editor} userId={userId} />}
      <div className="tiptap-content">
        <EditorContent editor={editor} />
      </div>
      {/* Status bar */}
      <div className="flex items-center justify-between border-t border-gray-100 px-4 py-2 dark:border-white/[0.05]">
        <span className="text-xs text-gray-400 dark:text-white/25">
          {wordCount.toLocaleString()} {wordCount === 1 ? "word" : "words"}
        </span>
        <span className="text-xs text-gray-400 dark:text-white/25">
          ~{readMins} min read
        </span>
      </div>
    </div>
  );
}
