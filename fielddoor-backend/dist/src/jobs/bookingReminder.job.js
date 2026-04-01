"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingReminderJob = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const client_1 = require("@prisma/client");
const database_1 = require("../config/database");
const sendPushNotif_1 = require("../utils/sendPushNotif");
exports.bookingReminderJob = node_cron_1.default.schedule("*/30 * * * *", async () => {
    const lower = new Date(Date.now() + 55 * 60 * 1000);
    const upper = new Date(Date.now() + 65 * 60 * 1000);
    const bookings = await database_1.prisma.booking.findMany({
        where: { status: client_1.BookingStatus.CONFIRMED },
        include: { slot: true, venue: true, sport: true, user: true }
    });
    for (const booking of bookings) {
        const slotStart = new Date(`${booking.slot.date}T${booking.slot.startTime}:00`);
        if (slotStart >= lower && slotStart <= upper) {
            await (0, sendPushNotif_1.sendToUser)(booking.userId, {
                title: "Your slot is in 1 hour!",
                body: `${booking.venue.name} · ${booking.sport.name} · ${booking.slot.startTime}`,
                data: { bookingId: booking.id }
            });
            await database_1.prisma.notification.create({
                data: {
                    userId: booking.userId,
                    type: client_1.NotificationType.BOOKING_REMINDER,
                    title: "Your slot is in 1 hour!",
                    body: `${booking.venue.name} · ${booking.sport.name} · ${booking.slot.startTime}`,
                    data: { bookingId: booking.id }
                }
            });
        }
    }
});
