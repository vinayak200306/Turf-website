"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationsService = void 0;
const database_1 = require("../../config/database");
const paginateQuery_1 = require("../../utils/paginateQuery");
exports.notificationsService = {
    async list(userId, page, limit) {
        const where = { userId };
        const total = await database_1.prisma.notification.count({ where });
        const notifications = await database_1.prisma.notification.findMany({
            where,
            ...(0, paginateQuery_1.buildPaginationArgs)(page, limit),
            orderBy: { createdAt: "desc" }
        });
        return { notifications, total };
    },
    async markRead(userId, notificationId) {
        return database_1.prisma.notification.updateMany({
            where: { id: notificationId, userId },
            data: { isRead: true }
        });
    }
};
