import type { Request, Response } from "express";

import { success } from "@utils/ApiResponse";
import { authService } from "./auth.service";

export const authController = {
  async sendOtp(req: Request, res: Response) {
    const result = await authService.sendOtp(req.body.phone, req.body.countryCode);
    return success(res, result, result.message);
  },

  async verifyOtp(req: Request, res: Response) {
    const result = await authService.verifyOtp(req.body.phone, req.body.countryCode, req.body.otp);
    return success(res, result, "OTP verified");
  },

  async refresh(req: Request, res: Response) {
    const result = await authService.refreshToken(req.body.refreshToken);
    return success(res, result, "Access token refreshed");
  },

  async logout(req: Request, res: Response) {
    const result = await authService.logout(req.user!.id);
    return success(res, result, "Logged out");
  }
};
