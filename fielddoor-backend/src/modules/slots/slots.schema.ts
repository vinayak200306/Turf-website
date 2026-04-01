import { z } from "zod";

export const getSlotsSchema = z.object({
  venueId: z.string().min(1),
  date: z.string().min(10),
  sportId: z.string().min(1),
  duration: z.coerce.number().min(1).max(3).default(1)
});

export const lockSlotSchema = z.object({
  venueId: z.string().min(1),
  date: z.string().min(10),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  sportId: z.string().min(1),
  duration: z.coerce.number().min(1).max(3)
});
