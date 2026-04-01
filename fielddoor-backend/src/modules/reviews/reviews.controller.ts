import type { Request, Response } from "express";

import { paginated, success } from "@utils/ApiResponse";
import { reviewsService } from "./reviews.service";

export const reviewsController = {
  async create(req: Request, res: Response) {
    const review = await reviewsService.create(
      req.user!.id,
      req.body.bookingId,
      req.body.rating,
      req.body.comment
    );
    return success(res, review, "Review created", 201);
  },

  async listVenueReviews(req: Request, res: Response) {
    const { page, limit, sortBy } = req.query as Record<string, string>;
    const result = await reviewsService.venueReviews(
      String(req.params.venueId),
      Number(page ?? 1),
      Number(limit ?? 10),
      (sortBy as "recent" | "highest" | "lowest") ?? "recent"
    );
    return paginated(
      res,
      result.reviews,
      Number(page ?? 1),
      Number(limit ?? 10),
      result.total
    );
  }
};
