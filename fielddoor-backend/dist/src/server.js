"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const database_1 = require("./config/database");
const env_1 = require("./config/env");
const redis_1 = require("./config/redis");
const index_1 = require("./jobs/index");
const logger_1 = __importDefault(require("./utils/logger"));
const app_1 = require("./app");
const server = http_1.default.createServer(app_1.app);
const shutdown = async (signal) => {
    logger_1.default.info(`Received ${signal}. Shutting down gracefully.`);
    server.close(async () => {
        await database_1.prisma.$disconnect();
        await redis_1.redis.quit();
        process.exit(0);
    });
};
server.listen(env_1.env.PORT, () => {
    logger_1.default.info(`Field Door backend listening on ${env_1.env.PORT}`);
    (0, index_1.registerJobs)();
});
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
