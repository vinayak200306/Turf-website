"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slotsController = void 0;
const ApiResponse_1 = require("../../utils/ApiResponse");
const slots_service_1 = require("./slots.service");
exports.slotsController = {
    async getSlots(req, res) {
        const query = req.query;
        const slots = await slots_service_1.slotsService.getSlots(query.venueId, query.date, query.sportId, Number(query.duration ?? 1));
        return (0, ApiResponse_1.success)(res, slots);
    },
    async lock(req, res) {
        const result = await slots_service_1.slotsService.lock(req.user.id, req.body.venueId, req.body.date, req.body.startTime, req.body.sportId, req.body.duration);
        return (0, ApiResponse_1.success)(res, result, "Slot locked");
    },
    async release(req, res) {
        const result = await slots_service_1.slotsService.release(req.user.id, String(req.params.slotId));
        return (0, ApiResponse_1.success)(res, result, "Slot released");
    }
};
