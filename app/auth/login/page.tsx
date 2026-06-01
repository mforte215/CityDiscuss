import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm px-6 py-20">
      <h1 className="mb-2 text-2xl font-bold tracking-tight">Welcome back</h1>
      <p className="mb-8 text-sm text-white/40">
        Log in to continue the discussion.
      </p>

      <AuthForm mode="login" />

      <p className="mt-6 text-center text-sm text-white/30">
        Don&apos;t have an account?{" "}
        <Link href="/auth/signup" className="text-blue-400 hover:text-blue-300">
          Sign up
        </Link>
      </p>
    </div>
  );
}
