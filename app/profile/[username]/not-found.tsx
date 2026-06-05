import Link from "next/link";

export default function ProfileNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <p className="mb-2 text-5xl font-black tracking-tight">404</p>
      <p className="mb-1 text-lg font-semibold">User not found</p>
      <p className="mb-8 text-sm text-gray-400 dark:text-white/30">That username doesn't exist.</p>
      <Link
        href="/"
        className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white"
      >
        Back to home
      </Link>
    </div>
  );
}
