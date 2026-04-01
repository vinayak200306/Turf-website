"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersController = void 0;
const ApiResponse_1 = require("../../utils/ApiResponse");
const users_service_1 = require("./users.service");
exports.usersController = {
    async me(req, res) {
        const user = await users_service_1.usersService.getMe(req.user.id);
        return (0, ApiResponse_1.success)(res, user);
    },
    async updateMe(req, res) {
        const user = await users_service_1.usersService.updateMe(req.user.id, req.body);
        return (0, ApiResponse_1.success)(res, user, "Profile updated");
    },
    async saveFcmToken(req, res) {
        const user = await users_service_1.usersService.saveFcmToken(req.user.id, req.body.token);
        return (0, ApiResponse_1.success)(res, user, "FCM token saved");
    },
    async myBookings(req, res) {
        const { status, page, limit } = req.query;
        const result = await users_service_1.usersService.getMyBookings(req.user.id, status, Number(page ?? 1), Number(limit ?? 10));
        return (0, ApiResponse_1.paginated)(res, result.bookings, Number(page ?? 1), Number(limit ?? 10), result.total);
    },
    async savedVenues(req, res) {
        const result = await users_service_1.usersService.getSavedVenues(req.user.id);
        return (0, ApiResponse_1.success)(res, result);
    },
    async toggleSavedVenue(req, res) {
        const result = await users_service_1.usersService.toggleSavedVenue(req.user.id, String(req.params.venueId));
        return (0, ApiResponse_1.success)(res, result, "Saved venues updated");
    },
    async notifications(req, res) {
        const { page, limit, unreadOnly } = req.query;
        const result = await users_service_1.usersService.getNotifications(req.user.id, Number(page ?? 1), Number(limit ?? 10), unreadOnly === "true");
        return (0, ApiResponse_1.paginated)(res, result.notifications, Number(page ?? 1), Number(limit ?? 10), result.total);
    },
    async readAllNotifications(req, res) {
        const result = await users_service_1.usersService.markAllNotificationsRead(req.user.id);
        return (0, ApiResponse_1.success)(res, result, "All notifications marked as read");
    }
};
