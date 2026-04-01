"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminService = void 0;
const database_1 = require("../../config/database");
const paginateQuery_1 = require("../../utils/paginateQuery");
exports.adminService = {
    async dashboard() {
        const today = new Date();
        const todayString = today.toISOString().slice(0, 10);
        const [totalUsers, totalVenues, totalBookings, pendingVenueApprovals, payments, bookingsToday] = await Promise.all([
            database_1.prisma.user.count(),
            database_1.prisma.venue.count(),
            database_1.prisma.booking.count(),
            database_1.prisma.venue.count({ where: { isApproved: false } }),
            database_1.prisma.payment.findMany({ where: { status: "CAPTURED" } }),
            database_1.prisma.booking.count({ where: { createdAt: { gte: new Date(`${todayString}T00:00:00`) } } })
        ]);
        const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
        const revenueToday = payments
            .filter((payment) => payment.paidAt?.toISOString().slice(0, 10) === todayString)
            .reduce((sum, payment) => sum + payment.amount, 0);
        return {
            totalUsers,
            totalVenues,
            totalBookings,
            totalRevenue,
            bookingsToday,
            revenueToday,
            pendingVenueApprovals
        };
    },
    async venues(approved, page, limit) {
        const where = approved === undefined ? {} : { isApproved: approved === "true" };
        const total = await database_1.prisma.venue.count({ where });
        const venues = await database_1.prisma.venue.findMany({
            where,
            ...(0, paginateQuery_1.buildPaginationArgs)(page, limit),
            include: {
                owner: {
                    include: {
                        user: true
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });
        return { venues, total };
    },
    async approveVenue(id, approved) {
        return database_1.prisma.venue.update({
            where: { id },
            data: { isApproved: approved }
        });
    },
    async users(role, page, limit) {
        const where = role ? { role: role } : {};
        const total = await database_1.prisma.user.count({ where });
        const users = await database_1.prisma.user.findMany({
            where,
            ...(0, paginateQuery_1.buildPaginationArgs)(page, limit),
            orderBy: { createdAt: "desc" }
        });
        return { users, total };
    },
    async updateUserStatus(id, isActive) {
        return database_1.prisma.user.update({
            where: { id },
            data: { isActive }
        });
    },
    async bookings(status, date, venueId, page, limit) {
        const where = {
            ...(status ? { status: status } : {}),
            ...(venueId ? { venueId } : {}),
            ...(date ? { slot: { date } } : {})
        };
        const total = await database_1.prisma.booking.count({ where });
        const bookings = await database_1.prisma.booking.findMany({
            where,
            ...(0, paginateQuery_1.buildPaginationArgs)(page, limit),
            include: { venue: true, slot: true, payment: true, user: true },
            orderBy: { createdAt: "desc" }
        });
        return { bookings, total };
    },
    async payments(status, page, limit) {
        const where = status ? { status: status } : {};
        const total = await database_1.prisma.payment.count({ where });
        const payments = await database_1.prisma.payment.findMany({
            where,
            ...(0, paginateQuery_1.buildPaginationArgs)(page, limit),
            include: { booking: true },
            orderBy: { createdAt: "desc" }
        });
        return { payments, total };
    }
};
