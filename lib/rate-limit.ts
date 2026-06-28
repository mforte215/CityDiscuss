import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

function createLimiter(requests: number, window: `${number} s` | `${number} m`) {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(requests, window),
    prefix: "citydiscuss",
  });
}

// 5 new posts per minute per IP
export const postLimiter = createLimiter(5, "1 m");

// 20 comments per minute per IP
export const commentLimiter = createLimiter(20, "1 m");

export async function checkRateLimit(
  limiter: ReturnType<typeof createLimiter>,
  key: string,
): Promise<{ limited: boolean }> {
  if (!limiter) return { limited: false };
  const { success } = await limiter.limit(key);
  return { limited: !success };
}
