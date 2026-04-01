"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentsController = void 0;
const ApiError_1 = require("../../utils/ApiError");
const ApiResponse_1 = require("../../utils/ApiResponse");
const payments_service_1 = require("./payments.service");
exports.paymentsController = {
    async verify(req, res) {
        const result = await payments_service_1.paymentsService.verifyPayment(req.user.id, req.body.bookingId, req.body.razorpayOrderId, req.body.razorpayPaymentId, req.body.razorpaySignature);
        return (0, ApiResponse_1.success)(res, result, "Booking confirmed");
    },
    async webhook(req, res) {
        const signature = String(req.headers["x-razorpay-signature"] ?? "");
        const rawBody = req.rawBody;
        if (!rawBody || !payments_service_1.paymentsService.verifyWebhookSignature(rawBody, signature)) {
            throw new ApiError_1.ApiError(400, "Invalid webhook signature", true, "INVALID_WEBHOOK_SIGNATURE");
        }
        const event = String(req.body.event);
        const entity = req.body.payload?.payment?.entity ?? req.body.payload?.refund?.entity ?? {};
        await payments_service_1.paymentsService.handleWebhook(event, entity);
        return res.status(200).json({ success: true });
    }
};
