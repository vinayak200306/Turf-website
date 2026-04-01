"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingCompletionJob = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const client_1 = require("@prisma/client");
const database_1 = require("../config/database");
const sendPushNotif_1 = require("../utils/sendPushNotif");
exports.bookingCompletionJob = node_cron_1.default.schedule("0 * * * *", async () => {
    const bookings = await database_1.prisma.booking.findMany({
        where: { status: client_1.BookingStatus.CONFIRMED },
        include: { slot: true, venue: true }
    });
    for (const booking of bookings) {
        const slotEnd = new Date(`${booking.slot.date}T${booking.slot.endTime}:00`);
        if (slotEnd < new Date()) {
            await database_1.prisma.booking.update({
                where: { id: booking.id },
                data: { status: client_1.BookingStatus.COMPLETED }
            });
            await (0, sendPushNotif_1.sendToUser)(booking.userId, {
                title: `Rate your experience at ${booking.venue.name}!`,
                body: "Your game is complete. Tell us how it went.",
                data: { bookingId: booking.id }
            });
            await database_1.prisma.notification.create({
                data: {
                    userId: booking.userId,
                    type: client_1.NotificationType.GENERAL,
                    title: `Rate your experience at ${booking.venue.name}!`,
                    body: "Your game is complete. Tell us how it went.",
                    data: { bookingId: booking.id }
                }
            });
        }
    }
});
