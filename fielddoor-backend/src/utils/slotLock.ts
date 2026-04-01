import { env } from "@config/env";
import { redis } from "@config/redis";

const keyFor = (venueId: string, date: string, startTime: string, sportId: string) =>
  `lock:slot:${venueId}:${date}:${startTime}:${sportId}`;

export const lockSlot = async (
  venueId: string,
  date: string,
  startTime: string,
  sportId: string,
  userId: string
) => {
  const result = await redis.set(
    keyFor(venueId, date, startTime, sportId),
    userId,
    "EX",
    env.SLOT_LOCK_TTL_SECONDS,
    "NX"
  );

  return result === "OK";
};

export const unlockSlot = async (
  venueId: string,
  date: string,
  startTime: string,
  sportId: string
) => {
  await redis.del(keyFor(venueId, date, startTime, sportId));
};

export const isSlotLocked = async (
  venueId: string,
  date: string,
  startTime: string,
  sportId: string
) => redis.get(keyFor(venueId, date, startTime, sportId));

export const getSlotLockKey = keyFor;
