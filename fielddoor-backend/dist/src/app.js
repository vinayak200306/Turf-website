"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const env_1 = require("./config/env");
const auth_router_1 = __importDefault(require("./modules/auth/auth.router"));
const users_router_1 = __importDefault(require("./modules/users/users.router"));
const venues_router_1 = __importDefault(require("./modules/venues/venues.router"));
const slots_router_1 = __importDefault(require("./modules/slots/slots.router"));
const bookings_router_1 = __importDefault(require("./modules/bookings/bookings.router"));
const payments_router_1 = __importDefault(require("./modules/payments/payments.router"));
const reviews_router_1 = __importDefault(require("./modules/reviews/reviews.router"));
const notifications_router_1 = __importDefault(require("./modules/notifications/notifications.router"));
const admin_router_1 = __importDefault(require("./modules/admin/admin.router"));
const uploads_router_1 = __importDefault(require("./modules/uploads/uploads.router"));
const rateLimiter_1 = require("./middleware/rateLimiter");
const requestLogger_1 = require("./middleware/requestLogger");
const errorHandler_1 = require("./middleware/errorHandler");
const swagger_1 = require("./swagger/swagger");
const database_1 = require("./config/database");
const ApiResponse_1 = require("./utils/ApiResponse");
exports.app = (0, express_1.default)();
exports.app.set("trust proxy", 1);
const allowedOrigins = env_1.env.ALLOWED_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
exports.app.use((0, cors_1.default)({
    origin(origin, callback) {
        if (!origin || !allowedOrigins.length || allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error("Origin not allowed by CORS"));
    }
}));
exports.app.use((0, helmet_1.default)({ contentSecurityPolicy: false }));
exports.app.use(express_1.default.json({
    limit: "2mb",
    verify: (req, _res, buffer) => {
        req.rawBody = Buffer.from(buffer);
    }
}));
exports.app.use(express_1.default.urlencoded({ extended: true }));
exports.app.use(requestLogger_1.requestLogger);
exports.app.use(rateLimiter_1.apiLimiter);
(0, swagger_1.setupSwagger)(exports.app);
exports.app.get("/api/v1/health", (_req, res) => (0, ApiResponse_1.success)(res, { status: "ok" }));
exports.app.get("/api/v1/frontend/bootstrap", async (_req, res) => {
    try {
        const [sports, venues] = await Promise.all([
            database_1.prisma.sport.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
            database_1.prisma.venue.findMany({
                where: { isApproved: true, isActive: true },
                include: {
                    images: { where: { isPrimary: true }, take: 1 },
                    sports: { include: { sport: true } }
                },
                take: 4,
                orderBy: { avgRating: "desc" }
            })
        ]);
        return (0, ApiResponse_1.success)(res, {
            sports,
            venues: venues.map((venue) => ({
                id: venue.id,
                name: venue.name,
                addressLine: venue.addressLine,
                city: venue.city,
                avgRating: venue.avgRating,
                primaryImage: venue.images[0]?.url ?? null,
                availableSlotCount: 6,
                priceRange: {
                    min: Math.min(...venue.sports.map((sport) => sport.pricePerHour)),
                    max: Math.max(...venue.sports.map((sport) => sport.pricePerHour))
                },
                sports: venue.sports.map((sport) => ({
                    sportId: sport.sportId,
                    pricePerHour: sport.pricePerHour,
                    sport: sport.sport
                }))
            }))
        });
    }
    catch {
        return (0, ApiResponse_1.success)(res, {
            sports: [
                { id: "sport_1", name: "Box Cricket", emoji: "🏏" },
                { id: "sport_2", name: "Football", emoji: "⚽" },
                { id: "sport_3", name: "Badminton", emoji: "🏸" },
                { id: "sport_4", name: "Tennis", emoji: "🎾" }
            ],
            venues: [
                {
                    id: "fallback-galaxy-zone",
                    name: "Galaxy Zone",
                    addressLine: "Koramangala",
                    city: "Bengaluru",
                    avgRating: 4.8,
                    primaryImage: null,
                    availableSlotCount: 6,
                    priceRange: { min: 800, max: 1000 },
                    sports: [{ sportId: "sport_1", pricePerHour: 800, sport: { id: "sport_1", name: "Box Cricket", emoji: "🏏" } }]
                },
                {
                    id: "fallback-skyline-sports-hub",
                    name: "Skyline Sports Hub",
                    addressLine: "HSR Layout",
                    city: "Bengaluru",
                    avgRating: 4.9,
                    primaryImage: null,
                    availableSlotCount: 8,
                    priceRange: { min: 900, max: 900 },
                    sports: [{ sportId: "sport_1", pricePerHour: 900, sport: { id: "sport_1", name: "Box Cricket", emoji: "🏏" } }]
                },
                {
                    id: "fallback-velocity-arena",
                    name: "Velocity Arena",
                    addressLine: "Whitefield",
                    city: "Bengaluru",
                    avgRating: 4.7,
                    primaryImage: null,
                    availableSlotCount: 5,
                    priceRange: { min: 1200, max: 1200 },
                    sports: [{ sportId: "sport_2", pricePerHour: 1200, sport: { id: "sport_2", name: "Football", emoji: "⚽" } }]
                }
            ]
        });
    }
});
exports.app.use("/api/v1/auth", auth_router_1.default);
exports.app.use("/api/v1/users", users_router_1.default);
exports.app.use("/api/v1/venues", venues_router_1.default);
exports.app.use("/api/v1/slots", slots_router_1.default);
exports.app.use("/api/v1/bookings", bookings_router_1.default);
exports.app.use("/api/v1/payments", payments_router_1.default);
exports.app.use("/api/v1/reviews", reviews_router_1.default);
exports.app.use("/api/v1/notifications", notifications_router_1.default);
exports.app.use("/api/v1/admin", admin_router_1.default);
exports.app.use("/api/v1/uploads", uploads_router_1.default);
const frontendRoot = path_1.default.resolve(process.cwd(), "..");
exports.app.use(express_1.default.static(frontendRoot));
exports.app.get("/", (_req, res) => {
    res.sendFile(path_1.default.join(frontendRoot, "index.html"));
});
exports.app.use(errorHandler_1.errorHandler);
