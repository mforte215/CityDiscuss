"use client";

type Tag = { id: string; name: string; slug: string };

export function TagPicker({
  available,
  selected,
  onChange,
}: {
  available: Tag[];
  selected: string[]; // tag ids
  onChange: (ids: string[]) => void;
}) {
  function toggle(id: string) {
    onChange(
      selected.includes(id)
        ? selected.filter((s) => s !== id)
        : [...selected, id],
    );
  }

  if (available.length === 0) {
    return (
      <p className="text-sm text-gray-400 dark:text-white/30">
        No tags yet.{" "}
        <a href="/admin/tags" className="text-blue-500 hover:underline">
          Create some in Admin → Tags
        </a>
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {available.map((tag) => {
        const active = selected.includes(tag.id);
        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => toggle(tag.id)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              active
                ? "bg-blue-500 text-white"
                : "border border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:text-gray-900 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white/50 dark:hover:border-white/20 dark:hover:text-white/80"
            }`}
          >
            {active && <span className="mr-1 text-xs">✓</span>}
            {tag.name}
          </button>
        );
      })}
    </div>
  );
}
