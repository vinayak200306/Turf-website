import type { Request, Response } from "express";

import { paginated, success } from "@utils/ApiResponse";
import { notificationsService } from "./notifications.service";

export const notificationsController = {
  async list(req: Request, res: Response) {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);
    const result = await notificationsService.list(req.user!.id, page, limit);
    return paginated(res, result.notifications, page, limit, result.total);
  },

  async read(req: Request, res: Response) {
    await notificationsService.markRead(req.user!.id, String(req.params.id));
    return success(res, { read: true }, "Notification marked as read");
  }
};
