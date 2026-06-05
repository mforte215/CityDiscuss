const COLORS = ["#2563eb", "#7c3aed", "#0891b2", "#059669", "#d97706"];

export function Avatar({
  username,
  avatarUrl,
  size = 32,
}: {
  username: string;
  avatarUrl?: string | null;
  size?: number;
}) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={username}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  const bg = COLORS[username.charCodeAt(0) % COLORS.length];
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, background: bg, fontSize: size * 0.35 }}
    >
      {username.slice(0, 2).toUpperCase()}
    </div>
  );
}
