import type { Request, Response } from "express";

import { success } from "@utils/ApiResponse";
import { slotsService } from "./slots.service";

export const slotsController = {
  async getSlots(req: Request, res: Response) {
    const query = req.query as Record<string, string>;
    const slots = await slotsService.getSlots(
      query.venueId,
      query.date,
      query.sportId,
      Number(query.duration ?? 1)
    );
    return success(res, slots);
  },

  async lock(req: Request, res: Response) {
    const result = await slotsService.lock(
      req.user!.id,
      req.body.venueId,
      req.body.date,
      req.body.startTime,
      req.body.sportId,
      req.body.duration
    );
    return success(res, result, "Slot locked");
  },

  async release(req: Request, res: Response) {
    const result = await slotsService.release(req.user!.id, String(req.params.slotId));
    return success(res, result, "Slot released");
  }
};
