"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lockSlotSchema = exports.getSlotsSchema = void 0;
const zod_1 = require("zod");
exports.getSlotsSchema = zod_1.z.object({
    venueId: zod_1.z.string().min(1),
    date: zod_1.z.string().min(10),
    sportId: zod_1.z.string().min(1),
    duration: zod_1.z.coerce.number().min(1).max(3).default(1)
});
exports.lockSlotSchema = zod_1.z.object({
    venueId: zod_1.z.string().min(1),
    date: zod_1.z.string().min(10),
    startTime: zod_1.z.string().regex(/^\d{2}:\d{2}$/),
    sportId: zod_1.z.string().min(1),
    duration: zod_1.z.coerce.number().min(1).max(3)
});
