"use client";

import { useRef, useState } from "react";

export function FollowButton({
  profileId,
  initialIsFollowing,
}: {
  profileId: string;
  initialIsFollowing: boolean;
}) {
  const [following, setFollowing] = useState(initialIsFollowing);
  const pending = useRef(false);

  async function toggle() {
    if (pending.current) return;
    pending.current = true;

    const prev = following;
    setFollowing(!following);

    const res = await fetch("/api/follows", {
      method: following ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ followingId: profileId }),
    });

    if (!res.ok) setFollowing(prev);
    pending.current = false;
  }

  return (
    <button
      onClick={toggle}
      className={`rounded-xl px-5 py-2 text-sm font-semibold transition-colors ${
        following
          ? "border border-gray-200 text-gray-600 hover:border-red-200 hover:bg-red-50 hover:text-red-500 dark:border-white/10 dark:text-white/60 dark:hover:border-red-500/30 dark:hover:bg-red-500/[0.06] dark:hover:text-red-400"
          : "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.2)]"
      }`}
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}
