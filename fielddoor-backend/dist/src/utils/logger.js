"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = require("winston");
const logger = (0, winston_1.createLogger)({
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
    format: winston_1.format.combine(winston_1.format.timestamp(), winston_1.format.errors({ stack: true }), winston_1.format.printf(({ level, message, timestamp, stack, ...meta }) => {
        const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
        return `${timestamp} [${level.toUpperCase()}] ${stack ?? message}${metaString}`;
    })),
    transports: [new winston_1.transports.Console()]
});
exports.default = logger;
