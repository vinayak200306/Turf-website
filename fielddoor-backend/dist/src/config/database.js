"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
exports.prisma = global.__fielddoorPrisma ??
    new client_1.PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["warn", "error"]
    });
if (process.env.NODE_ENV !== "production") {
    global.__fielddoorPrisma = exports.prisma;
}
