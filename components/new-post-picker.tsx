import Link from "next/link";

export function NewPostPicker() {
  return (
    <Link
      href="/new"
      className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 px-5 py-2.5 text-sm font-semibold shadow-[0_0_24px_rgba(59,130,246,0.25)] transition-opacity hover:opacity-90"
    >
      <span className="text-base font-normal">+</span> New post
    </Link>
  );
}
