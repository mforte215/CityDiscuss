import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log("KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const supabase = await createClient();
  const { data: cities } = await supabase
    .from("cities")
    .select("*")
    .order("name");

  return (
    <div className="mx-auto max-w-2xl px-6 py-20">
      <h1 className="bg-gradient-to-br from-white to-white/60 bg-clip-text text-4xl font-extrabold leading-tight tracking-tighter text-transparent">
        Your city.
        <br />
        Your conversation.
      </h1>
      <p className="mb-10 mt-2 max-w-md text-base leading-relaxed text-white/40">
        Real discussions about the places you live. No algorithms, no noise —
        just your neighbors talking.
      </p>

      <div className="flex flex-col gap-1.5">
        {cities?.map((city) => (
          <Link
            key={city.id}
            href={`/city/${city.slug}`}
            className="group flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-3.5 transition-all hover:border-blue-500/25 hover:bg-blue-500/[0.06]"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-base">
                🏙
              </div>
              <div>
                <div className="text-sm font-semibold">{city.name}</div>
                <div className="text-xs text-white/30">{city.state}</div>
              </div>
            </div>
            <span className="text-white/20 transition-colors group-hover:text-blue-400">
              →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
