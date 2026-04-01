"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSlotLockKey = exports.isSlotLocked = exports.unlockSlot = exports.lockSlot = void 0;
const env_1 = require("../config/env");
const redis_1 = require("../config/redis");
const keyFor = (venueId, date, startTime, sportId) => `lock:slot:${venueId}:${date}:${startTime}:${sportId}`;
const lockSlot = async (venueId, date, startTime, sportId, userId) => {
    const result = await redis_1.redis.set(keyFor(venueId, date, startTime, sportId), userId, "EX", env_1.env.SLOT_LOCK_TTL_SECONDS, "NX");
    return result === "OK";
};
exports.lockSlot = lockSlot;
const unlockSlot = async (venueId, date, startTime, sportId) => {
    await redis_1.redis.del(keyFor(venueId, date, startTime, sportId));
};
exports.unlockSlot = unlockSlot;
const isSlotLocked = async (venueId, date, startTime, sportId) => redis_1.redis.get(keyFor(venueId, date, startTime, sportId));
exports.isSlotLocked = isSlotLocked;
exports.getSlotLockKey = keyFor;
