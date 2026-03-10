import { Redis } from "ioredis";

export class getRedis {
  // singleton to get single redis connection
  private static instance: Redis | null = null;

  getRedisInstance(): Redis {
    if (getRedis.instance) return getRedis.instance;

    const redis = new Redis(process.env.REDIS_URL!, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 200, 2000),
      lazyConnect: false,
    });
    getRedis.instance = redis; // attach new instance to getRedis.instance (static property)

    redis.on("connect", () => console.log("[redis] connected"));
    redis.on("error", (err) => console.error("[redis] error:", err));

    return redis;
  }
}
