"use client";

import { useRouter } from "next/navigation";

export function CityDropdown({
  cities,
  current,
  sort,
}: {
  cities: { name: string; slug: string }[];
  current: string;
  sort: string;
}) {
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const city = e.target.value;
    if (city) {
      router.push(`/city/${city}`);
    } else {
      router.push(`/forum${sort !== "hot" ? `?sort=${sort}` : ""}`);
    }
  }

  return (
    <select
      value={current}
      onChange={handleChange}
      className={`rounded-xl border px-3 py-1.5 text-sm outline-none transition-colors ${
        current
          ? "border-blue-300 bg-blue-50 font-medium text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-400"
          : "border-gray-200 bg-gray-50 text-gray-500 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white/40"
      }`}
    >
      <option value="">Find your community</option>
      {cities.map((c) => (
        <option key={c.slug} value={c.slug}>
          {c.name}
        </option>
      ))}
    </select>
  );
}
