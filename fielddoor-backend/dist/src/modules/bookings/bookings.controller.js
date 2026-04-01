"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingsController = void 0;
const ApiResponse_1 = require("../../utils/ApiResponse");
const bookings_service_1 = require("./bookings.service");
exports.bookingsController = {
    async create(req, res) {
        const result = await bookings_service_1.bookingsService.create(req.user.id, req.body.slotId);
        return (0, ApiResponse_1.success)(res, result, "Booking created", 201);
    },
    async details(req, res) {
        const booking = await bookings_service_1.bookingsService.getById(req.user.id, String(req.params.id), req.user.role === "ADMIN");
        return (0, ApiResponse_1.success)(res, booking);
    },
    async cancel(req, res) {
        const result = await bookings_service_1.bookingsService.cancel(req.user.id, String(req.params.id), req.body.reason);
        return (0, ApiResponse_1.success)(res, result, "Booking cancelled");
    }
};
