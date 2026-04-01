"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../../config/database");
const env_1 = require("../../config/env");
const redis_1 = require("../../config/redis");
const ApiError_1 = require("../../utils/ApiError");
const generateOTP_1 = require("../../utils/generateOTP");
const logger_1 = __importDefault(require("../../utils/logger"));
const normalizePhone = (phone, countryCode) => `${countryCode}${phone}`;
const signAccessToken = (userId, role) => jsonwebtoken_1.default.sign({ userId, role, tokenType: "access" }, env_1.env.ACCESS_TOKEN_SECRET, {
    expiresIn: env_1.env.ACCESS_TOKEN_EXPIRY
});
const signRefreshToken = (userId, role) => jsonwebtoken_1.default.sign({ userId, role, tokenType: "refresh" }, env_1.env.REFRESH_TOKEN_SECRET, {
    expiresIn: env_1.env.REFRESH_TOKEN_EXPIRY
});
const buildTokens = async (userId, role) => {
    const accessToken = signAccessToken(userId, role);
    const refreshToken = signRefreshToken(userId, role);
    const hashedRefreshToken = await bcryptjs_1.default.hash(refreshToken, 10);
    await database_1.prisma.user.update({
        where: { id: userId },
        data: { refreshToken: hashedRefreshToken }
    });
    return { accessToken, refreshToken };
};
exports.authService = {
    normalizePhone,
    async sendOtp(phone, countryCode) {
        const fullPhone = normalizePhone(phone, countryCode);
        const otpRateKey = `otp:rate:${fullPhone}`;
        const otpRateCount = await redis_1.redis.incr(otpRateKey);
        if (otpRateCount === 1) {
            await redis_1.redis.expire(otpRateKey, 600);
        }
        if (otpRateCount > 3) {
            throw new ApiError_1.ApiError(429, "OTP request limit exceeded", true, "OTP_RATE_LIMIT");
        }
        const user = await database_1.prisma.user.upsert({
            where: { phone: fullPhone },
            update: { countryCode },
            create: { phone: fullPhone, countryCode }
        });
        const plainOtp = (0, generateOTP_1.generateOTP)();
        const hashedOtp = await bcryptjs_1.default.hash(plainOtp, 10);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await database_1.prisma.otpLog.create({
            data: {
                userId: user.id,
                otp: hashedOtp,
                expiresAt
            }
        });
        logger_1.default.info(`[OTP] Phone: ${fullPhone} | OTP: ${plainOtp}`);
        return {
            success: true,
            message: "OTP sent",
            expiresIn: 600
        };
    },
    async verifyOtp(phone, countryCode, otp) {
        const fullPhone = normalizePhone(phone, countryCode);
        const user = await database_1.prisma.user.findUnique({
            where: { phone: fullPhone }
        });
        if (!user) {
            throw new ApiError_1.ApiError(404, "User not found", true, "USER_NOT_FOUND");
        }
        const otpLog = await database_1.prisma.otpLog.findFirst({
            where: {
                userId: user.id,
                verified: false
            },
            orderBy: { createdAt: "desc" }
        });
        if (!otpLog) {
            throw new ApiError_1.ApiError(400, "OTP not found", true, "OTP_NOT_FOUND");
        }
        const attemptKey = `otp:attempts:${fullPhone}`;
        const currentAttempts = Number((await redis_1.redis.get(attemptKey)) ?? "0");
        if (currentAttempts >= 5 || otpLog.attempts >= 5) {
            throw new ApiError_1.ApiError(429, "Too many incorrect OTP attempts", true, "OTP_LOCKED");
        }
        if (otpLog.expiresAt.getTime() < Date.now()) {
            throw new ApiError_1.ApiError(400, "OTP expired", true, "OTP_EXPIRED");
        }
        const isMatch = await bcryptjs_1.default.compare(otp, otpLog.otp);
        if (!isMatch) {
            const nextAttempts = currentAttempts + 1;
            await redis_1.redis.set(attemptKey, String(nextAttempts), "EX", 600);
            await database_1.prisma.otpLog.update({
                where: { id: otpLog.id },
                data: { attempts: otpLog.attempts + 1 }
            });
            throw new ApiError_1.ApiError(400, "Invalid OTP", true, "OTP_INVALID");
        }
        await database_1.prisma.otpLog.update({
            where: { id: otpLog.id },
            data: { verified: true }
        });
        await redis_1.redis.del(attemptKey);
        const tokens = await buildTokens(user.id, user.role);
        return {
            ...tokens,
            user: {
                id: user.id,
                phone: user.phone,
                name: user.name,
                role: user.role
            }
        };
    },
    async refreshToken(refreshToken) {
        const payload = jsonwebtoken_1.default.verify(refreshToken, env_1.env.REFRESH_TOKEN_SECRET);
        const user = await database_1.prisma.user.findUnique({
            where: { id: payload.userId }
        });
        if (!user?.refreshToken) {
            throw new ApiError_1.ApiError(401, "Invalid refresh token", true, "INVALID_REFRESH");
        }
        const isValid = await bcryptjs_1.default.compare(refreshToken, user.refreshToken);
        if (!isValid) {
            throw new ApiError_1.ApiError(401, "Invalid refresh token", true, "INVALID_REFRESH");
        }
        return {
            accessToken: signAccessToken(user.id, user.role)
        };
    },
    async logout(userId) {
        await database_1.prisma.user.update({
            where: { id: userId },
            data: { refreshToken: null }
        });
        await redis_1.redis.del(`user:session:${userId}`);
        return { success: true };
    },
    generateMockPaymentSignature(orderId, paymentId) {
        return crypto_1.default
            .createHmac("sha256", env_1.env.RAZORPAY_KEY_SECRET || "fielddoor_local_secret")
            .update(`${orderId}|${paymentId}`)
            .digest("hex");
    }
};
