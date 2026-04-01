import type { Request, Response } from "express";

import { success } from "@utils/ApiResponse";
import { bookingsService } from "./bookings.service";

export const bookingsController = {
  async create(req: Request, res: Response) {
    const result = await bookingsService.create(req.user!.id, req.body.slotId);
    return success(res, result, "Booking created", 201);
  },

  async details(req: Request, res: Response) {
    const booking = await bookingsService.getById(
      req.user!.id,
      String(req.params.id),
      req.user!.role === "ADMIN"
    );
    return success(res, booking);
  },

  async cancel(req: Request, res: Response) {
    const result = await bookingsService.cancel(req.user!.id, String(req.params.id), req.body.reason);
    return success(res, result, "Booking cancelled");
  }
};
