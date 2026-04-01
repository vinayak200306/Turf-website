"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slotsService = void 0;
const client_1 = require("@prisma/client");
const database_1 = require("../../config/database");
const env_1 = require("../../config/env");
const ApiError_1 = require("../../utils/ApiError");
const slotLock_1 = require("../../utils/slotLock");
const toMinutes = (time) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
};
const toTime = (minutes) => {
    const hours = Math.floor(minutes / 60)
        .toString()
        .padStart(2, "0");
    const mins = (minutes % 60).toString().padStart(2, "0");
    return `${hours}:${mins}`;
};
const periodFor = (hour) => {
    if (hour < 12) {
        return "MORNING";
    }
    if (hour < 17) {
        return "AFTERNOON";
    }
    return "EVENING";
};
exports.slotsService = {
    async getSlots(venueId, date, sportId, duration = 1) {
        const venue = await database_1.prisma.venue.findUniqueOrThrow({
            where: { id: venueId },
            include: {
                sports: {
                    where: { sportId }
                }
            }
        });
        const venueSport = venue.sports[0];
        if (!venueSport) {
            throw new ApiError_1.ApiError(404, "Sport not available for venue", true, "SPORT_NOT_FOUND");
        }
        const startMinutes = toMinutes(venue.openTime);
        const endMinutes = toMinutes(venue.closeTime);
        const existingSlots = await database_1.prisma.slot.findMany({
            where: { venueId, date, sportId }
        });
        const response = [];
        for (let current = startMinutes; current + duration * 60 <= endMinutes; current += 60) {
            const startTime = toTime(current);
            const endTime = toTime(current + duration * 60);
            const existing = existingSlots.find((slot) => slot.startTime === startTime && slot.endTime === endTime && slot.durationHrs === duration);
            const lockedBy = await (0, slotLock_1.isSlotLocked)(venueId, date, startTime, sportId);
            const status = existing?.status === client_1.SlotStatus.BOOKED
                ? client_1.SlotStatus.BOOKED
                : lockedBy
                    ? client_1.SlotStatus.LOCKED
                    : client_1.SlotStatus.AVAILABLE;
            response.push({
                venueId,
                sportId,
                date,
                startTime,
                endTime,
                durationHrs: duration,
                priceTotal: venueSport.pricePerHour * duration,
                status,
                period: periodFor(Math.floor(current / 60))
            });
        }
        return response;
    },
    async lock(userId, venueId, date, startTime, sportId, duration) {
        const venue = await database_1.prisma.venue.findUniqueOrThrow({
            where: { id: venueId },
            include: { sports: { where: { sportId } } }
        });
        const venueSport = venue.sports[0];
        if (!venueSport) {
            throw new ApiError_1.ApiError(404, "Sport not configured for venue", true, "SPORT_NOT_FOUND");
        }
        const endTime = toTime(toMinutes(startTime) + duration * 60);
        const existing = await database_1.prisma.slot.findUnique({
            where: {
                venueId_sportId_date_startTime_endTime: {
                    venueId,
                    sportId,
                    date,
                    startTime,
                    endTime
                }
            }
        });
        if (existing?.status === client_1.SlotStatus.BOOKED) {
            throw new ApiError_1.ApiError(409, "Slot already booked", true, "SLOT_BOOKED");
        }
        const locked = await (0, slotLock_1.lockSlot)(venueId, date, startTime, sportId, userId);
        if (!locked) {
            throw new ApiError_1.ApiError(409, "Slot is already locked by another user", true, "SLOT_LOCKED");
        }
        const lockedUntil = new Date(Date.now() + env_1.env.SLOT_LOCK_TTL_SECONDS * 1000);
        const slot = await database_1.prisma.slot.upsert({
            where: {
                venueId_sportId_date_startTime_endTime: {
                    venueId,
                    sportId,
                    date,
                    startTime,
                    endTime
                }
            },
            update: {
                durationHrs: duration,
                priceTotal: venueSport.pricePerHour * duration,
                status: client_1.SlotStatus.LOCKED,
                lockedUntil
            },
            create: {
                venueId,
                sportId,
                date,
                startTime,
                endTime,
                durationHrs: duration,
                priceTotal: venueSport.pricePerHour * duration,
                status: client_1.SlotStatus.LOCKED,
                lockedUntil
            }
        });
        return {
            slotId: slot.id,
            lockedUntil,
            totalPrice: slot.priceTotal
        };
    },
    async release(userId, slotId) {
        const slot = await database_1.prisma.slot.findUniqueOrThrow({
            where: { id: slotId }
        });
        const lockOwner = await (0, slotLock_1.isSlotLocked)(slot.venueId, slot.date, slot.startTime, slot.sportId);
        if (lockOwner !== userId) {
            throw new ApiError_1.ApiError(403, "You do not own this slot lock", true, "LOCK_OWNERSHIP_ERROR");
        }
        await (0, slotLock_1.unlockSlot)(slot.venueId, slot.date, slot.startTime, slot.sportId);
        await database_1.prisma.slot.update({
            where: { id: slot.id },
            data: {
                status: client_1.SlotStatus.AVAILABLE,
                lockedUntil: null
            }
        });
        return { released: true };
    }
};
