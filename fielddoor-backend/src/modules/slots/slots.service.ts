import { SlotStatus } from "@prisma/client";

import { prisma } from "@config/database";
import { env } from "@config/env";
import { ApiError } from "@utils/ApiError";
import { isSlotLocked, lockSlot, unlockSlot } from "@utils/slotLock";

const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const toTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const mins = (minutes % 60).toString().padStart(2, "0");
  return `${hours}:${mins}`;
};

const periodFor = (hour: number) => {
  if (hour < 12) {
    return "MORNING";
  }
  if (hour < 17) {
    return "AFTERNOON";
  }
  return "EVENING";
};

export const slotsService = {
  async getSlots(venueId: string, date: string, sportId: string, duration = 1) {
    const venue = await prisma.venue.findUniqueOrThrow({
      where: { id: venueId },
      include: {
        sports: {
          where: { sportId }
        }
      }
    });

    const venueSport = venue.sports[0];
    if (!venueSport) {
      throw new ApiError(404, "Sport not available for venue", true, "SPORT_NOT_FOUND");
    }

    const startMinutes = toMinutes(venue.openTime);
    const endMinutes = toMinutes(venue.closeTime);

    const existingSlots = await prisma.slot.findMany({
      where: { venueId, date, sportId }
    });

    const response = [];
    for (let current = startMinutes; current + duration * 60 <= endMinutes; current += 60) {
      const startTime = toTime(current);
      const endTime = toTime(current + duration * 60);
      const existing = existingSlots.find(
        (slot) => slot.startTime === startTime && slot.endTime === endTime && slot.durationHrs === duration
      );

      const lockedBy = await isSlotLocked(venueId, date, startTime, sportId);
      const status =
        existing?.status === SlotStatus.BOOKED
          ? SlotStatus.BOOKED
          : lockedBy
            ? SlotStatus.LOCKED
            : SlotStatus.AVAILABLE;

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

  async lock(userId: string, venueId: string, date: string, startTime: string, sportId: string, duration: number) {
    const venue = await prisma.venue.findUniqueOrThrow({
      where: { id: venueId },
      include: { sports: { where: { sportId } } }
    });

    const venueSport = venue.sports[0];
    if (!venueSport) {
      throw new ApiError(404, "Sport not configured for venue", true, "SPORT_NOT_FOUND");
    }

    const endTime = toTime(toMinutes(startTime) + duration * 60);
    const existing = await prisma.slot.findUnique({
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

    if (existing?.status === SlotStatus.BOOKED) {
      throw new ApiError(409, "Slot already booked", true, "SLOT_BOOKED");
    }

    const locked = await lockSlot(venueId, date, startTime, sportId, userId);
    if (!locked) {
      throw new ApiError(409, "Slot is already locked by another user", true, "SLOT_LOCKED");
    }

    const lockedUntil = new Date(Date.now() + env.SLOT_LOCK_TTL_SECONDS * 1000);
    const slot = await prisma.slot.upsert({
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
        status: SlotStatus.LOCKED,
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
        status: SlotStatus.LOCKED,
        lockedUntil
      }
    });

    return {
      slotId: slot.id,
      lockedUntil,
      totalPrice: slot.priceTotal
    };
  },

  async release(userId: string, slotId: string) {
    const slot = await prisma.slot.findUniqueOrThrow({
      where: { id: slotId }
    });
    const lockOwner = await isSlotLocked(slot.venueId, slot.date, slot.startTime, slot.sportId);
    if (lockOwner !== userId) {
      throw new ApiError(403, "You do not own this slot lock", true, "LOCK_OWNERSHIP_ERROR");
    }

    await unlockSlot(slot.venueId, slot.date, slot.startTime, slot.sportId);
    await prisma.slot.update({
      where: { id: slot.id },
      data: {
        status: SlotStatus.AVAILABLE,
        lockedUntil: null
      }
    });

    return { released: true };
  }
};
