import type { Request, Response } from "express";

import { paginated, success } from "@utils/ApiResponse";
import { usersService } from "./users.service";

export const usersController = {
  async me(req: Request, res: Response) {
    const user = await usersService.getMe(req.user!.id);
    return success(res, user);
  },

  async updateMe(req: Request, res: Response) {
    const user = await usersService.updateMe(req.user!.id, req.body);
    return success(res, user, "Profile updated");
  },

  async saveFcmToken(req: Request, res: Response) {
    const user = await usersService.saveFcmToken(req.user!.id, req.body.token);
    return success(res, user, "FCM token saved");
  },

  async myBookings(req: Request, res: Response) {
    const { status, page, limit } = req.query as Record<string, string>;
    const result = await usersService.getMyBookings(
      req.user!.id,
      status,
      Number(page ?? 1),
      Number(limit ?? 10)
    );
    return paginated(res, result.bookings, Number(page ?? 1), Number(limit ?? 10), result.total);
  },

  async savedVenues(req: Request, res: Response) {
    const result = await usersService.getSavedVenues(req.user!.id);
    return success(res, result);
  },

  async toggleSavedVenue(req: Request, res: Response) {
    const result = await usersService.toggleSavedVenue(req.user!.id, String(req.params.venueId));
    return success(res, result, "Saved venues updated");
  },

  async notifications(req: Request, res: Response) {
    const { page, limit, unreadOnly } = req.query as Record<string, string>;
    const result = await usersService.getNotifications(
      req.user!.id,
      Number(page ?? 1),
      Number(limit ?? 10),
      unreadOnly === "true"
    );
    return paginated(
      res,
      result.notifications,
      Number(page ?? 1),
      Number(limit ?? 10),
      result.total
    );
  },

  async readAllNotifications(req: Request, res: Response) {
    const result = await usersService.markAllNotificationsRead(req.user!.id);
    return success(res, result, "All notifications marked as read");
  }
};
