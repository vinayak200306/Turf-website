import cron from "node-cron";
import { BookingStatus, NotificationType } from "@prisma/client";

import { prisma } from "@config/database";
import { sendToUser } from "@utils/sendPushNotif";

export const bookingReminderJob = cron.schedule("*/30 * * * *", async () => {
  const lower = new Date(Date.now() + 55 * 60 * 1000);
  const upper = new Date(Date.now() + 65 * 60 * 1000);

  const bookings = await prisma.booking.findMany({
    where: { status: BookingStatus.CONFIRMED },
    include: { slot: true, venue: true, sport: true, user: true }
  });

  for (const booking of bookings) {
    const slotStart = new Date(`${booking.slot.date}T${booking.slot.startTime}:00`);
    if (slotStart >= lower && slotStart <= upper) {
      await sendToUser(booking.userId, {
        title: "Your slot is in 1 hour!",
        body: `${booking.venue.name} · ${booking.sport.name} · ${booking.slot.startTime}`,
        data: { bookingId: booking.id }
      });
      await prisma.notification.create({
        data: {
          userId: booking.userId,
          type: NotificationType.BOOKING_REMINDER,
          title: "Your slot is in 1 hour!",
          body: `${booking.venue.name} · ${booking.sport.name} · ${booking.slot.startTime}`,
          data: { bookingId: booking.id }
        }
      });
    }
  }
});
