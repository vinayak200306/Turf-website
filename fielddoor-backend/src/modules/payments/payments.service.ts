import crypto from "crypto";
import {
  BookingStatus,
  NotificationType,
  PaymentStatus,
  RefundStatus,
  type Booking,
  type Payment
} from "@prisma/client";

import { prisma } from "@config/database";
import { env } from "@config/env";
import { isRazorpayConfigured } from "@config/razorpay";
import { ApiError } from "@utils/ApiError";
import { sendBookingConfirmationEmail, sendPaymentFailureEmail, sendRefundProcessedEmail } from "@utils/sendEmail";
import { sendToUser } from "@utils/sendPushNotif";
import { unlockSlot } from "@utils/slotLock";
import logger from "@utils/logger";
import { bookingsService } from "../bookings/bookings.service";

const verifySignature = (orderId: string, paymentId: string, signature: string) => {
  const expectedSig = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET || "fielddoor_local_secret")
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return expectedSig === signature;
};

const applyConfirmation = async (bookingId: string, paymentPatch: Partial<Payment>) => {
  const booking = await prisma.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: {
      payment: true,
      slot: true,
      user: true,
      venue: true,
      sport: true
    }
  });

  if (booking.status === BookingStatus.CONFIRMED && booking.payment?.status === PaymentStatus.CAPTURED) {
    return booking;
  }

  const totalBookings = booking.user.totalBookings + 1;
  const memberTier = bookingsService.upgradeMemberTier(totalBookings);

  await prisma.$transaction([
    prisma.payment.update({
      where: { bookingId },
      data: {
        ...paymentPatch,
        status: PaymentStatus.CAPTURED,
        paidAt: new Date()
      }
    }),
    prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CONFIRMED }
    }),
    prisma.slot.update({
      where: { id: booking.slotId },
      data: { status: "BOOKED", lockedUntil: null }
    }),
    prisma.user.update({
      where: { id: booking.userId },
      data: {
        totalBookings,
        memberTier
      }
    })
  ]);

  await unlockSlot(booking.slot.venueId, booking.slot.date, booking.slot.startTime, booking.slot.sportId);

  await prisma.notification.create({
    data: {
      userId: booking.userId,
      type: NotificationType.BOOKING_CONFIRMED,
      title: "Booking confirmed",
      body: `${booking.venue.name} on ${booking.slot.date} at ${booking.slot.startTime}`,
      data: { bookingId }
    }
  });

  void sendToUser(booking.userId, {
    title: "Booking confirmed",
    body: `${booking.venue.name} · ${booking.slot.startTime}`,
    data: { bookingId }
  });
  void sendBookingConfirmationEmail(
    { ...booking.user, totalBookings, memberTier } as never,
    booking as never,
    booking.slot,
    booking.venue,
    booking.sport
  );

  return prisma.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: {
      payment: true,
      slot: true,
      venue: true,
      sport: true
    }
  });
};

export const paymentsService = {
  async verifyPayment(
    userId: string,
    bookingId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ) {
    const booking = await prisma.booking.findUniqueOrThrow({
      where: { id: bookingId },
      include: { payment: true }
    });

    if (booking.userId !== userId) {
      throw new ApiError(403, "Forbidden", true, "FORBIDDEN");
    }

    const isMock = !isRazorpayConfigured && razorpayOrderId.startsWith("order_mock_");
    const signatureValid =
      isMock ? true : verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);

    if (!signatureValid) {
      logger.warn("Potential Razorpay signature mismatch", {
        userId,
        bookingId,
        razorpayOrderId,
        razorpayPaymentId
      });
      throw new ApiError(400, "Invalid payment signature", true, "INVALID_SIGNATURE");
    }

    const confirmedBooking = await applyConfirmation(bookingId, {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    });

    return {
      confirmed: true,
      bookingRef: confirmedBooking.bookingRef,
      booking: confirmedBooking
    };
  },

  async handleWebhook(event: string, entity: Record<string, unknown>) {
    if (event === "payment.captured") {
      const orderId = String(entity.order_id);
      const paymentId = String(entity.id);
      const payment = await prisma.payment.findUnique({
        where: { razorpayOrderId: orderId }
      });
      if (!payment) {
        return { processed: false };
      }

      await applyConfirmation(payment.bookingId, {
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: "webhook_verified"
      });
      return { processed: true };
    }

    if (event === "payment.failed") {
      const orderId = String(entity.order_id);
      const payment = await prisma.payment.findUnique({
        where: { razorpayOrderId: orderId },
        include: {
          booking: {
            include: {
              user: true,
              venue: true
            }
          }
        }
      });
      if (!payment) {
        return { processed: false };
      }

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          failureReason: String(entity.error_description ?? "Payment failed")
        }
      });
      void sendPaymentFailureEmail(payment.booking.user, payment.booking as Booking, payment.booking.venue);
      await prisma.notification.create({
        data: {
          userId: payment.booking.userId,
          type: NotificationType.PAYMENT_FAILED,
          title: "Payment failed",
          body: `${payment.booking.bookingRef} payment failed.`,
          data: { bookingId: payment.bookingId }
        }
      });
      return { processed: true };
    }

    if (event === "refund.processed") {
      const refundId = String(entity.id);
      const payment = await prisma.payment.findFirst({
        where: { razorpayRefundId: refundId },
        include: {
          booking: {
            include: { user: true }
          }
        }
      });
      if (!payment) {
        return { processed: false };
      }

      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.REFUNDED }
        }),
        prisma.booking.update({
          where: { id: payment.bookingId },
          data: { status: BookingStatus.CANCELLED, refundStatus: RefundStatus.PROCESSED }
        })
      ]);

      void sendRefundProcessedEmail(
        payment.booking.user,
        payment.booking as Booking,
        payment.booking.refundAmount ?? 0
      );
      await prisma.notification.create({
        data: {
          userId: payment.booking.userId,
          type: NotificationType.REFUND_PROCESSED,
          title: "Refund processed",
          body: `${payment.booking.bookingRef} refund is processed.`,
          data: { bookingId: payment.bookingId }
        }
      });
      return { processed: true };
    }

    return { processed: false };
  },

  verifyWebhookSignature(rawBody: Buffer, signature: string) {
    const expected = crypto
      .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET || "fielddoor_webhook_secret")
      .update(rawBody)
      .digest("hex");

    return expected === signature;
  }
};
