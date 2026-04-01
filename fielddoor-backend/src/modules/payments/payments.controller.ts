import type { Request, Response } from "express";

import { ApiError } from "@utils/ApiError";
import { success } from "@utils/ApiResponse";
import { paymentsService } from "./payments.service";

export const paymentsController = {
  async verify(req: Request, res: Response) {
    const result = await paymentsService.verifyPayment(
      req.user!.id,
      req.body.bookingId,
      req.body.razorpayOrderId,
      req.body.razorpayPaymentId,
      req.body.razorpaySignature
    );
    return success(res, result, "Booking confirmed");
  },

  async webhook(req: Request, res: Response) {
    const signature = String(req.headers["x-razorpay-signature"] ?? "");
    const rawBody = req.rawBody;
    if (!rawBody || !paymentsService.verifyWebhookSignature(rawBody, signature)) {
      throw new ApiError(400, "Invalid webhook signature", true, "INVALID_WEBHOOK_SIGNATURE");
    }

    const event = String(req.body.event);
    const entity = req.body.payload?.payment?.entity ?? req.body.payload?.refund?.entity ?? {};
    await paymentsService.handleWebhook(event, entity);
    return res.status(200).json({ success: true });
  }
};
