import { z } from "zod";

export const createBookingSchema = z.object({
  slotId: z.string().min(1)
});

export const cancelBookingSchema = z.object({
  reason: z.string().max(250).optional()
});
