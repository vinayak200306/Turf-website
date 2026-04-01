import { z } from "zod";

export const venueListQuerySchema = z.object({
  sportId: z.string().optional(),
  city: z.string().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radius: z.coerce.number().default(10),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  minRating: z.coerce.number().optional(),
  date: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
  sortBy: z.enum(["rating", "price", "distance"]).optional()
});

export const venueSearchQuerySchema = z.object({
  q: z.string().min(1)
});
