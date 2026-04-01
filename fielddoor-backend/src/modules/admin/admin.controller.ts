import type { Request, Response } from "express";

import { paginated, success } from "@utils/ApiResponse";
import { adminService } from "./admin.service";

export const adminController = {
  async dashboard(_req: Request, res: Response) {
    const result = await adminService.dashboard();
    return success(res, result);
  },

  async venues(req: Request, res: Response) {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);
    const result = await adminService.venues(
      typeof req.query.approved === "string" ? req.query.approved : undefined,
      page,
      limit
    );
    return paginated(res, result.venues, page, limit, result.total);
  },

  async approveVenue(req: Request, res: Response) {
    const venue = await adminService.approveVenue(String(req.params.id), Boolean(req.body.approved));
    return success(res, venue, "Venue approval updated");
  },

  async users(req: Request, res: Response) {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);
    const result = await adminService.users(
      typeof req.query.role === "string" ? req.query.role : undefined,
      page,
      limit
    );
    return paginated(res, result.users, page, limit, result.total);
  },

  async updateUserStatus(req: Request, res: Response) {
    const user = await adminService.updateUserStatus(String(req.params.id), Boolean(req.body.isActive));
    return success(res, user, "User status updated");
  },

  async bookings(req: Request, res: Response) {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);
    const result = await adminService.bookings(
      typeof req.query.status === "string" ? req.query.status : undefined,
      typeof req.query.date === "string" ? req.query.date : undefined,
      typeof req.query.venueId === "string" ? req.query.venueId : undefined,
      page,
      limit
    );
    return paginated(res, result.bookings, page, limit, result.total);
  },

  async payments(req: Request, res: Response) {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);
    const result = await adminService.payments(
      typeof req.query.status === "string" ? req.query.status : undefined,
      page,
      limit
    );
    return paginated(res, result.payments, page, limit, result.total);
  }
};
