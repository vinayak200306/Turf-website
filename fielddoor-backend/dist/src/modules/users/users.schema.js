"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationQuerySchema = exports.bookingsQuerySchema = exports.fcmTokenSchema = exports.updateProfileSchema = void 0;
const zod_1 = require("zod");
exports.updateProfileSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(60).optional(),
    email: zod_1.z.string().email().optional(),
    avatarUrl: zod_1.z.string().url().optional()
});
exports.fcmTokenSchema = zod_1.z.object({
    token: zod_1.z.string().min(20)
});
exports.bookingsQuerySchema = zod_1.z.object({
    status: zod_1.z.string().optional(),
    page: zod_1.z.coerce.number().min(1).default(1),
    limit: zod_1.z.coerce.number().min(1).max(50).default(10)
});
exports.notificationQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().min(1).default(1),
    limit: zod_1.z.coerce.number().min(1).max(50).default(10),
    unreadOnly: zod_1.z.coerce.boolean().optional()
});
