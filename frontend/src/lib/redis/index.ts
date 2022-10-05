import Redis from "ioredis";

export const redis = new Redis(import.meta.env.REDIS_URL, {
  tls: { rejectUnauthorized: false },
})
