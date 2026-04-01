"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ApiError_1 = require("../utils/ApiError");
const logger_1 = __importDefault(require("../utils/logger"));
const errorHandler = (error, _req, res, _next) => {
    if (error instanceof ApiError_1.ApiError) {
        return res.status(error.statusCode).json({
            success: false,
            message: error.message,
            code: error.code
        });
    }
    if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
            const fields = Array.isArray(error.meta?.target) ? error.meta?.target.join(", ") : "field";
            return res.status(409).json({
                success: false,
                message: `Duplicate value for ${fields}`,
                code: "UNIQUE_CONSTRAINT"
            });
        }
        if (error.code === "P2025") {
            return res.status(404).json({
                success: false,
                message: "Record not found",
                code: "NOT_FOUND"
            });
        }
    }
    if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
        return res.status(401).json({
            success: false,
            message: "Invalid token",
            code: "INVALID_TOKEN"
        });
    }
    if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
        return res.status(401).json({
            success: false,
            message: "Token expired",
            code: "TOKEN_EXPIRED"
        });
    }
    logger_1.default.error("Unhandled server error", { error, stack: error.stack });
    return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        code: "INTERNAL_ERROR"
    });
};
exports.errorHandler = errorHandler;
