"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.slotExpiryJob = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const client_1 = require("@prisma/client");
const database_1 = require("../config/database");
const logger_1 = __importDefault(require("../utils/logger"));
const slotLock_1 = require("../utils/slotLock");
exports.slotExpiryJob = node_cron_1.default.schedule("*/2 * * * *", async () => {
    const expiredSlots = await database_1.prisma.slot.findMany({
        where: {
            status: client_1.SlotStatus.LOCKED,
            lockedUntil: { lt: new Date() }
        }
    });
    for (const slot of expiredSlots) {
        await database_1.prisma.slot.update({
            where: { id: slot.id },
            data: { status: client_1.SlotStatus.AVAILABLE, lockedUntil: null }
        });
        await (0, slotLock_1.unlockSlot)(slot.venueId, slot.date, slot.startTime, slot.sportId);
    }
    if (expiredSlots.length) {
        logger_1.default.info("Expired slot locks released", { count: expiredSlots.length });
    }
});
