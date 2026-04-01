"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersService = void 0;
const database_1 = require("../../config/database");
const redis_1 = require("../../config/redis");
const paginateQuery_1 = require("../../utils/paginateQuery");
exports.usersService = {
    async getMe(userId) {
        return database_1.prisma.user.findUniqueOrThrow({
            where: { id: userId }
        });
    },
    async updateMe(userId, payload) {
        const user = await database_1.prisma.user.update({
            where: { id: userId },
            data: payload
        });
        await redis_1.redis.del(`user:session:${userId}`);
        return user;
    },
    async saveFcmToken(userId, token) {
        return database_1.prisma.user.update({
            where: { id: userId },
            data: { fcmToken: token }
        });
    },
    async getMyBookings(userId, status, page, limit) {
        const where = {
            userId,
            ...(status ? { status: status } : {})
        };
        const total = await database_1.prisma.booking.count({ where });
        const bookings = await database_1.prisma.booking.findMany({
            where,
            ...(0, paginateQuery_1.buildPaginationArgs)(page, limit),
            include: {
                venue: true,
                slot: true,
                payment: true,
                sport: true
            },
            orderBy: { createdAt: "desc" }
        });
        return { bookings, total };
    },
    async getSavedVenues(userId) {
        return database_1.prisma.savedVenue.findMany({
            where: { userId },
            include: {
                venue: {
                    include: {
                        images: { orderBy: { order: "asc" }, take: 1 },
                        sports: { include: { sport: true } }
                    }
                }
            }
        });
    },
    async toggleSavedVenue(userId, venueId) {
        const existing = await database_1.prisma.savedVenue.findUnique({
            where: {
                userId_venueId: { userId, venueId }
            }
        });
        if (existing) {
            await database_1.prisma.savedVenue.delete({ where: { id: existing.id } });
            return { saved: false };
        }
        await database_1.prisma.savedVenue.create({
            data: { userId, venueId }
        });
        return { saved: true };
    },
    async getNotifications(userId, page, limit, unreadOnly) {
        const where = {
            userId,
            ...(unreadOnly ? { isRead: false } : {})
        };
        const total = await database_1.prisma.notification.count({ where });
        const notifications = await database_1.prisma.notification.findMany({
            where,
            ...(0, paginateQuery_1.buildPaginationArgs)(page, limit),
            orderBy: { createdAt: "desc" }
        });
        return { notifications, total };
    },
    async markAllNotificationsRead(userId) {
        await database_1.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true }
        });
        return { updated: true };
    }
};
