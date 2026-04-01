"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleGuard = void 0;
const ApiError_1 = require("../utils/ApiError");
const roleGuard = (...roles) => (req, _res, next) => {
    if (!req.user) {
        return next(new ApiError_1.ApiError(401, "Authentication required", true, "AUTH_REQUIRED"));
    }
    if (!roles.includes(req.user.role)) {
        return next(new ApiError_1.ApiError(403, "Forbidden", true, "FORBIDDEN"));
    }
    return next();
};
exports.roleGuard = roleGuard;
