"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelBookingSchema = exports.createBookingSchema = void 0;
const zod_1 = require("zod");
exports.createBookingSchema = zod_1.z.object({
    slotId: zod_1.z.string().min(1)
});
exports.cancelBookingSchema = zod_1.z.object({
    reason: zod_1.z.string().max(250).optional()
});
