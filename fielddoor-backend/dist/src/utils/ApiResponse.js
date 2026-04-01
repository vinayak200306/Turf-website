"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginated = exports.success = void 0;
const success = (res, data, message = "OK", statusCode = 200) => res.status(statusCode).json({
    success: true,
    message,
    data
});
exports.success = success;
const paginated = (res, data, page, limit, total, statusCode = 200) => res.status(statusCode).json({
    success: true,
    data,
    pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    }
});
exports.paginated = paginated;
