"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationsController = void 0;
const ApiResponse_1 = require("../../utils/ApiResponse");
const notifications_service_1 = require("./notifications.service");
exports.notificationsController = {
    async list(req, res) {
        const page = Number(req.query.page ?? 1);
        const limit = Number(req.query.limit ?? 10);
        const result = await notifications_service_1.notificationsService.list(req.user.id, page, limit);
        return (0, ApiResponse_1.paginated)(res, result.notifications, page, limit, result.total);
    },
    async read(req, res) {
        await notifications_service_1.notificationsService.markRead(req.user.id, String(req.params.id));
        return (0, ApiResponse_1.success)(res, { read: true }, "Notification marked as read");
    }
};
