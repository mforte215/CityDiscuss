"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <p className="mb-2 text-5xl font-black tracking-tight">500</p>
      <p className="mb-1 text-lg font-semibold">Something went wrong</p>
      <p className="mb-8 text-sm text-gray-400 dark:text-white/30">
        An unexpected error occurred. Please try again.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 dark:border-white/10 dark:text-white/50 dark:hover:bg-white/5"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
