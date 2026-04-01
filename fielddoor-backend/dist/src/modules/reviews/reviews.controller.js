"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewsController = void 0;
const ApiResponse_1 = require("../../utils/ApiResponse");
const reviews_service_1 = require("./reviews.service");
exports.reviewsController = {
    async create(req, res) {
        const review = await reviews_service_1.reviewsService.create(req.user.id, req.body.bookingId, req.body.rating, req.body.comment);
        return (0, ApiResponse_1.success)(res, review, "Review created", 201);
    },
    async listVenueReviews(req, res) {
        const { page, limit, sortBy } = req.query;
        const result = await reviews_service_1.reviewsService.venueReviews(String(req.params.venueId), Number(page ?? 1), Number(limit ?? 10), sortBy ?? "recent");
        return (0, ApiResponse_1.paginated)(res, result.reviews, Number(page ?? 1), Number(limit ?? 10), result.total);
    }
};
