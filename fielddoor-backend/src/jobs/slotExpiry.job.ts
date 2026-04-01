import cron from "node-cron";
import { SlotStatus } from "@prisma/client";

import { prisma } from "@config/database";
import logger from "@utils/logger";
import { unlockSlot } from "@utils/slotLock";

export const slotExpiryJob = cron.schedule("*/2 * * * *", async () => {
  const expiredSlots = await prisma.slot.findMany({
    where: {
      status: SlotStatus.LOCKED,
      lockedUntil: { lt: new Date() }
    }
  });

  for (const slot of expiredSlots) {
    await prisma.slot.update({
      where: { id: slot.id },
      data: { status: SlotStatus.AVAILABLE, lockedUntil: null }
    });
    await unlockSlot(slot.venueId, slot.date, slot.startTime, slot.sportId);
  }

  if (expiredSlots.length) {
    logger.info("Expired slot locks released", { count: expiredSlots.length });
  }
});
