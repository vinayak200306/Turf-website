"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const ApiResponse_1 = require("../../utils/ApiResponse");
const auth_service_1 = require("./auth.service");
exports.authController = {
    async sendOtp(req, res) {
        const result = await auth_service_1.authService.sendOtp(req.body.phone, req.body.countryCode);
        return (0, ApiResponse_1.success)(res, result, result.message);
    },
    async verifyOtp(req, res) {
        const result = await auth_service_1.authService.verifyOtp(req.body.phone, req.body.countryCode, req.body.otp);
        return (0, ApiResponse_1.success)(res, result, "OTP verified");
    },
    async refresh(req, res) {
        const result = await auth_service_1.authService.refreshToken(req.body.refreshToken);
        return (0, ApiResponse_1.success)(res, result, "Access token refreshed");
    },
    async logout(req, res) {
        const result = await auth_service_1.authService.logout(req.user.id);
        return (0, ApiResponse_1.success)(res, result, "Logged out");
    }
};
