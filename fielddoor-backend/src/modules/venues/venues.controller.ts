import type { Request, Response } from "express";

import { paginated, success } from "@utils/ApiResponse";
import { venuesService } from "./venues.service";

export const venuesController = {
  async list(req: Request, res: Response) {
    const query = req.query as unknown as {
      sportId?: string;
      city?: string;
      lat?: string;
      lng?: string;
      radius: string;
      minPrice?: string;
      maxPrice?: string;
      minRating?: string;
      date?: string;
      page: string;
      limit: string;
      sortBy?: "rating" | "price" | "distance";
    };

    const result = await venuesService.list({
      sportId: query.sportId,
      city: query.city,
      lat: query.lat ? Number(query.lat) : undefined,
      lng: query.lng ? Number(query.lng) : undefined,
      radius: Number(query.radius ?? 10),
      minPrice: query.minPrice ? Number(query.minPrice) : undefined,
      maxPrice: query.maxPrice ? Number(query.maxPrice) : undefined,
      minRating: query.minRating ? Number(query.minRating) : undefined,
      date: query.date,
      page: Number(query.page ?? 1),
      limit: Number(query.limit ?? 10),
      sortBy: query.sortBy,
      userId: req.user?.id
    });

    return paginated(
      res,
      result.venues,
      Number(query.page ?? 1),
      Number(query.limit ?? 10),
      result.total
    );
  },

  async details(req: Request, res: Response) {
    const venue = await venuesService.getById(String(req.params.id), req.user?.id);
    return success(res, venue);
  },

  async search(req: Request, res: Response) {
    const result = await venuesService.search(String(req.query.q));
    return success(res, result);
  }
};
