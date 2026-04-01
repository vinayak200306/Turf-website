"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.auth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const env_1 = require("../config/env");
const redis_1 = require("../config/redis");
const ApiError_1 = require("../utils/ApiError");
const getBearerToken = (req) => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        return null;
    }
    return header.slice(7);
};
const resolveUser = async (userId) => {
    const cacheKey = `user:session:${userId}`;
    const cached = await redis_1.redis.get(cacheKey);
    if (cached) {
        return JSON.parse(cached);
    }
    const user = await database_1.prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            phone: true,
            countryCode: true,
            name: true,
            email: true,
            avatarUrl: true,
            role: true,
            isActive: true,
            fcmToken: true,
            walletBalance: true,
            memberTier: true,
            totalBookings: true
        }
    });
    if (user) {
        await redis_1.redis.set(cacheKey, JSON.stringify(user), "EX", 300);
    }
    return user;
};
const auth = async (req, _res, next) => {
    try {
        const token = getBearerToken(req);
        if (!token) {
            throw new ApiError_1.ApiError(401, "Authentication required", true, "AUTH_REQUIRED");
        }
        const payload = jsonwebtoken_1.default.verify(token, env_1.env.ACCESS_TOKEN_SECRET);
        const user = await resolveUser(payload.userId);
        if (!user) {
            throw new ApiError_1.ApiError(401, "Invalid session", true, "INVALID_SESSION");
        }
        if (!user.isActive) {
            throw new ApiError_1.ApiError(403, "User account is deactivated", true, "ACCOUNT_DISABLED");
        }
        req.user = user;
        return next();
    }
    catch (error) {
        return next(error);
    }
};
exports.auth = auth;
const optionalAuth = async (req, _res, next) => {
    try {
        const token = getBearerToken(req);
        if (!token) {
            return next();
        }
        const payload = jsonwebtoken_1.default.verify(token, env_1.env.ACCESS_TOKEN_SECRET);
        const user = await resolveUser(payload.userId);
        if (user && user.isActive) {
            req.user = user;
        }
        return next();
    }
    catch {
        return next();
    }
};
exports.optionalAuth = optionalAuth;
