import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Create account — CityDiscuss",
  description: "Sign up and start discussing what matters in your city.",
};

export default async function SignupPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/");

  return (
    <div className="mx-auto max-w-sm px-6 py-20">
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
        Create your account
      </h1>
      <p className="mb-8 text-sm text-gray-500 dark:text-white/40">
        Join the conversation in your city.
      </p>

      <AuthForm mode="signup" />

      <p className="mt-6 text-center text-sm text-gray-400 dark:text-white/30">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-blue-500 hover:text-blue-400 dark:text-blue-400 dark:hover:text-blue-300">
          Log in
        </Link>
      </p>
    </div>
  );
}
