"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.venueSearchQuerySchema = exports.venueListQuerySchema = void 0;
const zod_1 = require("zod");
exports.venueListQuerySchema = zod_1.z.object({
    sportId: zod_1.z.string().optional(),
    city: zod_1.z.string().optional(),
    lat: zod_1.z.coerce.number().optional(),
    lng: zod_1.z.coerce.number().optional(),
    radius: zod_1.z.coerce.number().default(10),
    minPrice: zod_1.z.coerce.number().optional(),
    maxPrice: zod_1.z.coerce.number().optional(),
    minRating: zod_1.z.coerce.number().optional(),
    date: zod_1.z.string().optional(),
    page: zod_1.z.coerce.number().min(1).default(1),
    limit: zod_1.z.coerce.number().min(1).max(50).default(10),
    sortBy: zod_1.z.enum(["rating", "price", "distance"]).optional()
});
exports.venueSearchQuerySchema = zod_1.z.object({
    q: zod_1.z.string().min(1)
});
