"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewsService = void 0;
const database_1 = require("../../config/database");
const ApiError_1 = require("../../utils/ApiError");
const paginateQuery_1 = require("../../utils/paginateQuery");
exports.reviewsService = {
    async create(userId, bookingId, rating, comment) {
        const booking = await database_1.prisma.booking.findUniqueOrThrow({
            where: { id: bookingId },
            include: { slot: true, venue: true }
        });
        if (booking.userId !== userId || booking.status !== "COMPLETED") {
            throw new ApiError_1.ApiError(400, "Only completed bookings can be reviewed", true, "REVIEW_NOT_ALLOWED");
        }
        const review = await database_1.prisma.review.create({
            data: {
                bookingId,
                userId,
                venueId: booking.venueId,
                rating,
                comment
            }
        });
        const aggregate = await database_1.prisma.review.aggregate({
            where: { venueId: booking.venueId, isVisible: true },
            _avg: { rating: true },
            _count: { _all: true }
        });
        await database_1.prisma.venue.update({
            where: { id: booking.venueId },
            data: {
                avgRating: aggregate._avg.rating ?? 0,
                totalReviews: aggregate._count._all
            }
        });
        return review;
    },
    async venueReviews(venueId, page, limit, sortBy) {
        const orderBy = sortBy === "highest"
            ? { rating: "desc" }
            : sortBy === "lowest"
                ? { rating: "asc" }
                : { createdAt: "desc" };
        const where = { venueId, isVisible: true };
        const total = await database_1.prisma.review.count({ where });
        const reviews = await database_1.prisma.review.findMany({
            where,
            ...(0, paginateQuery_1.buildPaginationArgs)(page, limit),
            include: {
                user: {
                    select: {
                        name: true,
                        avatarUrl: true
                    }
                }
            },
            orderBy
        });
        return {
            reviews: reviews.map((review) => ({
                ...review,
                userName: review.user.name ?? "Player",
                avatarInitial: (review.user.name ?? "P").charAt(0).toUpperCase()
            })),
            total
        };
    }
};
