"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.venueReviewsQuerySchema = exports.createReviewSchema = void 0;
const zod_1 = require("zod");
exports.createReviewSchema = zod_1.z.object({
    bookingId: zod_1.z.string().min(1),
    rating: zod_1.z.number().int().min(1).max(5),
    comment: zod_1.z.string().min(10).max(500)
});
exports.venueReviewsQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().min(1).default(1),
    limit: zod_1.z.coerce.number().min(1).max(50).default(10),
    sortBy: zod_1.z.enum(["recent", "highest", "lowest"]).default("recent")
});
