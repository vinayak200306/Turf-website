"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPaymentSchema = void 0;
const zod_1 = require("zod");
exports.verifyPaymentSchema = zod_1.z.object({
    razorpayOrderId: zod_1.z.string().min(1),
    razorpayPaymentId: zod_1.z.string().min(1),
    razorpaySignature: zod_1.z.string().min(1),
    bookingId: zod_1.z.string().min(1)
});
