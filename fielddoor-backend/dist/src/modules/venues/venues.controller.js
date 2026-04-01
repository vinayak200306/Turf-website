"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.venuesController = void 0;
const ApiResponse_1 = require("../../utils/ApiResponse");
const venues_service_1 = require("./venues.service");
exports.venuesController = {
    async list(req, res) {
        const query = req.query;
        const result = await venues_service_1.venuesService.list({
            sportId: query.sportId,
            city: query.city,
            lat: query.lat ? Number(query.lat) : undefined,
            lng: query.lng ? Number(query.lng) : undefined,
            radius: Number(query.radius ?? 10),
            minPrice: query.minPrice ? Number(query.minPrice) : undefined,
            maxPrice: query.maxPrice ? Number(query.maxPrice) : undefined,
            minRating: query.minRating ? Number(query.minRating) : undefined,
            date: query.date,
            page: Number(query.page ?? 1),
            limit: Number(query.limit ?? 10),
            sortBy: query.sortBy,
            userId: req.user?.id
        });
        return (0, ApiResponse_1.paginated)(res, result.venues, Number(query.page ?? 1), Number(query.limit ?? 10), result.total);
    },
    async details(req, res) {
        const venue = await venues_service_1.venuesService.getById(String(req.params.id), req.user?.id);
        return (0, ApiResponse_1.success)(res, venue);
    },
    async search(req, res) {
        const result = await venues_service_1.venuesService.search(String(req.query.q));
        return (0, ApiResponse_1.success)(res, result);
    }
};
