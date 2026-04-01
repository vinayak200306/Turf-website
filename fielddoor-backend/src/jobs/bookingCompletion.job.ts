import cron from "node-cron";
import { BookingStatus, NotificationType } from "@prisma/client";

import { prisma } from "@config/database";
import { sendToUser } from "@utils/sendPushNotif";

export const bookingCompletionJob = cron.schedule("0 * * * *", async () => {
  const bookings = await prisma.booking.findMany({
    where: { status: BookingStatus.CONFIRMED },
    include: { slot: true, venue: true }
  });

  for (const booking of bookings) {
    const slotEnd = new Date(`${booking.slot.date}T${booking.slot.endTime}:00`);
    if (slotEnd < new Date()) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.COMPLETED }
      });
      await sendToUser(booking.userId, {
        title: `Rate your experience at ${booking.venue.name}!`,
        body: "Your game is complete. Tell us how it went.",
        data: { bookingId: booking.id }
      });
      await prisma.notification.create({
        data: {
          userId: booking.userId,
          type: NotificationType.GENERAL,
          title: `Rate your experience at ${booking.venue.name}!`,
          body: "Your game is complete. Tell us how it went.",
          data: { bookingId: booking.id }
        }
      });
    }
  }
});
