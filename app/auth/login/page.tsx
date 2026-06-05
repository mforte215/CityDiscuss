import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Log in — CityDiscuss",
  description: "Log in to join the conversation in your city.",
};

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm px-6 py-20">
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
        Welcome back
      </h1>
      <p className="mb-8 text-sm text-gray-500 dark:text-white/40">
        Log in to continue the discussion.
      </p>

      <AuthForm mode="login" />

      <p className="mt-6 text-center text-sm text-gray-400 dark:text-white/30">
        Don&apos;t have an account?{" "}
        <Link href="/auth/signup" className="text-blue-500 hover:text-blue-400 dark:text-blue-400 dark:hover:text-blue-300">
          Sign up
        </Link>
      </p>
    </div>
  );
}
