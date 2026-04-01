"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminController = void 0;
const ApiResponse_1 = require("../../utils/ApiResponse");
const admin_service_1 = require("./admin.service");
exports.adminController = {
    async dashboard(_req, res) {
        const result = await admin_service_1.adminService.dashboard();
        return (0, ApiResponse_1.success)(res, result);
    },
    async venues(req, res) {
        const page = Number(req.query.page ?? 1);
        const limit = Number(req.query.limit ?? 10);
        const result = await admin_service_1.adminService.venues(typeof req.query.approved === "string" ? req.query.approved : undefined, page, limit);
        return (0, ApiResponse_1.paginated)(res, result.venues, page, limit, result.total);
    },
    async approveVenue(req, res) {
        const venue = await admin_service_1.adminService.approveVenue(String(req.params.id), Boolean(req.body.approved));
        return (0, ApiResponse_1.success)(res, venue, "Venue approval updated");
    },
    async users(req, res) {
        const page = Number(req.query.page ?? 1);
        const limit = Number(req.query.limit ?? 10);
        const result = await admin_service_1.adminService.users(typeof req.query.role === "string" ? req.query.role : undefined, page, limit);
        return (0, ApiResponse_1.paginated)(res, result.users, page, limit, result.total);
    },
    async updateUserStatus(req, res) {
        const user = await admin_service_1.adminService.updateUserStatus(String(req.params.id), Boolean(req.body.isActive));
        return (0, ApiResponse_1.success)(res, user, "User status updated");
    },
    async bookings(req, res) {
        const page = Number(req.query.page ?? 1);
        const limit = Number(req.query.limit ?? 10);
        const result = await admin_service_1.adminService.bookings(typeof req.query.status === "string" ? req.query.status : undefined, typeof req.query.date === "string" ? req.query.date : undefined, typeof req.query.venueId === "string" ? req.query.venueId : undefined, page, limit);
        return (0, ApiResponse_1.paginated)(res, result.bookings, page, limit, result.total);
    },
    async payments(req, res) {
        const page = Number(req.query.page ?? 1);
        const limit = Number(req.query.limit ?? 10);
        const result = await admin_service_1.adminService.payments(typeof req.query.status === "string" ? req.query.status : undefined, page, limit);
        return (0, ApiResponse_1.paginated)(res, result.payments, page, limit, result.total);
    }
};
