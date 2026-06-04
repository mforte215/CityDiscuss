"use client";

import Link from "next/link";

export default function AdminArticlesPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Articles</h1>
        <Link
          href="/admin/articles/new"
          className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 px-4 py-2 text-sm font-semibold"
        >
          + New article
        </Link>
      </div>
      <p className="text-sm text-white/30">Article list coming soon.</p>
    </div>
  );
}
