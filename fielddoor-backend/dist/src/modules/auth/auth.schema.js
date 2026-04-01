"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshSchema = exports.verifyOtpSchema = exports.sendOtpSchema = void 0;
const zod_1 = require("zod");
const countryCodeSchema = zod_1.z.string().regex(/^\+\d{1,4}$/, "Invalid country code");
const phoneSchema = zod_1.z.string().regex(/^\d{10,12}$/, "Invalid phone number");
exports.sendOtpSchema = zod_1.z.object({
    phone: phoneSchema,
    countryCode: countryCodeSchema.default("+91")
});
exports.verifyOtpSchema = zod_1.z.object({
    phone: phoneSchema,
    countryCode: countryCodeSchema.default("+91"),
    otp: zod_1.z.string().regex(/^\d{6}$/, "OTP must be 6 digits")
});
exports.refreshSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(10)
});
