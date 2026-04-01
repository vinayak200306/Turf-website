"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentLimiter = exports.otpLimiter = exports.authLimiter = exports.apiLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const buildLimiter = (windowMs, limit, message) => (0, express_rate_limit_1.default)({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message,
        code: "RATE_LIMITED"
    }
});
exports.apiLimiter = buildLimiter(15 * 60 * 1000, 100, "Too many requests");
exports.authLimiter = buildLimiter(15 * 60 * 1000, 10, "Too many auth attempts");
exports.otpLimiter = buildLimiter(10 * 60 * 1000, 5, "Too many OTP requests");
exports.paymentLimiter = buildLimiter(5 * 60 * 1000, 20, "Too many payment requests");
