import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(60).optional(),
  email: z.string().email().optional(),
  avatarUrl: z.string().url().optional()
});

export const fcmTokenSchema = z.object({
  token: z.string().min(20)
});

export const bookingsQuerySchema = z.object({
  status: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10)
});

export const notificationQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
  unreadOnly: z.coerce.boolean().optional()
});
