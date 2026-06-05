import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminCitiesPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) redirect("/");

  const { data: cities } = await supabase
    .from("cities")
    .select("name, slug, state, description")
    .order("name");

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="text-sm text-gray-400 hover:text-gray-700 dark:text-white/30 dark:hover:text-white/60"
          >
            ← Dashboard
          </Link>
          <span className="text-gray-300 dark:text-white/15">/</span>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Cities
          </h1>
        </div>
        <span className="text-sm text-gray-400 dark:text-white/30">
          {cities?.length ?? 0} cities
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        {cities?.map((city) => (
          <div
            key={city.slug}
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 dark:border-white/[0.07] dark:bg-white/[0.02]"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {city.name}
                </p>
                <span className="text-xs text-gray-400 dark:text-white/30">
                  {city.state}
                </span>
              </div>
              <p className="mt-0.5 truncate text-sm text-gray-400 dark:text-white/30">
                {city.description ?? (
                  <span className="italic text-gray-300 dark:text-white/20">
                    No description
                  </span>
                )}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Link
                href={`/city/${city.slug}`}
                target="_blank"
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 dark:border-white/10 dark:text-white/40 dark:hover:bg-white/5"
              >
                View
              </Link>
              <Link
                href={`/admin/cities/${city.slug}/edit`}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-white/10 dark:text-white/60 dark:hover:bg-white/5"
              >
                Edit
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
