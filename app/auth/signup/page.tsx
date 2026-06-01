import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-sm px-6 py-20">
      <h1 className="mb-2 text-2xl font-bold tracking-tight">
        Create your account
      </h1>
      <p className="mb-8 text-sm text-white/40">
        Join the conversation in your city.
      </p>

      <AuthForm mode="signup" />

      <p className="mt-6 text-center text-sm text-white/30">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-blue-400 hover:text-blue-300">
          Log in
        </Link>
      </p>
    </div>
  );
}
