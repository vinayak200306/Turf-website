import Redis from "ioredis";

import { env } from "./env";

declare global {
  // eslint-disable-next-line no-var
  var __fielddoorRedis: Redis | undefined;
}

export const redis =
  global.__fielddoorRedis ??
  new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
  });

if (process.env.NODE_ENV !== "production") {
  global.__fielddoorRedis = redis;
}
