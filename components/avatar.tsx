import Image from "next/image";

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
      <Image
        src={avatarUrl}
        alt={`${username}'s avatar`}
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover"
      />
    );
  }

  const bg = COLORS[username.charCodeAt(0) % COLORS.length];
  return (
    <div
      role="img"
      aria-label={`${username}'s avatar`}
      className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, background: bg, fontSize: size * 0.35 }}
    >
      <span aria-hidden="true">{username.slice(0, 2).toUpperCase()}</span>
    </div>
  );
}
