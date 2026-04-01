import crypto from "crypto";
import {
  BookingStatus,
  MemberTier,
  NotificationType,
  PaymentStatus,
  RefundStatus,
  SlotStatus
} from "@prisma/client";

import { prisma } from "@config/database";
import { env } from "@config/env";
import { isRazorpayConfigured, razorpay } from "@config/razorpay";
import { ApiError } from "@utils/ApiError";
import { generateBookingId } from "@utils/generateBookingId";
import { sendCancellationEmail } from "@utils/sendEmail";
import { sendToUser } from "@utils/sendPushNotif";
import { isSlotLocked, unlockSlot } from "@utils/slotLock";

const upgradeMemberTier = (totalBookings: number) => {
  if (totalBookings >= 25) {
    return MemberTier.PLATINUM;
  }
  if (totalBookings >= 15) {
    return MemberTier.GOLD;
  }
  if (totalBookings >= 7) {
    return MemberTier.SILVER;
  }
  return MemberTier.BRONZE;
};

const slotDateTime = (date: string, time: string) => new Date(`${date}T${time}:00`);

const calculateRefundAmount = (bookingDate: string, bookingStartTime: string, totalAmount: number) => {
  const slotStart = slotDateTime(bookingDate, bookingStartTime);
  const hoursUntil = (slotStart.getTime() - Date.now()) / (1000 * 60 * 60);

  if (hoursUntil > env.CANCELLATION_FULL_REFUND_HOURS) {
    return totalAmount;
  }
  if (hoursUntil >= env.CANCELLATION_PARTIAL_REFUND_HOURS) {
    return Number((totalAmount * env.CANCELLATION_PARTIAL_REFUND_PCT).toFixed(2));
  }
  return 0;
};

const createOrder = async (amount: number, receipt: string) => {
  if (isRazorpayConfigured && razorpay) {
    return razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt
    });
  }

  return {
    id: `order_mock_${crypto.randomBytes(6).toString("hex")}`,
    amount: Math.round(amount * 100),
    currency: "INR",
    receipt
  };
};

export const bookingsService = {
  upgradeMemberTier,

  async create(userId: string, slotId: string) {
    const slot = await prisma.slot.findUniqueOrThrow({
      where: { id: slotId },
      include: {
        venue: true,
        sport: true
      }
    });

    if (slot.status !== SlotStatus.LOCKED) {
      throw new ApiError(409, "Slot is not locked", true, "SLOT_UNLOCKED");
    }

    const lockValue = await isSlotLocked(slot.venueId, slot.date, slot.startTime, slot.sportId);
    if (lockValue !== userId) {
      throw new ApiError(403, "Slot lock belongs to another user", true, "LOCK_MISMATCH");
    }

    const slotFee = slot.priceTotal;
    const gstAmount = Number((slotFee * env.GST_RATE).toFixed(2));
    const convenienceFee = env.CONVENIENCE_FEE;
    const totalAmount = Number((slotFee + gstAmount + convenienceFee).toFixed(2));
    const bookingRef = generateBookingId();

    const booking = await prisma.booking.create({
      data: {
        bookingRef,
        userId,
        venueId: slot.venueId,
        slotId: slot.id,
        sportId: slot.sportId,
        slotFee,
        gstAmount,
        convenienceFee,
        totalAmount,
        status: BookingStatus.PENDING
      }
    });

    const order = await createOrder(totalAmount, bookingRef);
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        razorpayOrderId: order.id,
        amount: totalAmount,
        status: PaymentStatus.CREATED
      }
    });

    return {
      bookingId: booking.id,
      bookingRef: booking.bookingRef,
      razorpayOrderId: order.id,
      razorpayKeyId: env.RAZORPAY_KEY_ID || "rzp_test_mock",
      amount: totalAmount
    };
  },

  async getById(requestUserId: string, bookingId: string, isAdmin = false) {
    const booking = await prisma.booking.findUniqueOrThrow({
      where: { id: bookingId },
      include: {
        slot: true,
        venue: true,
        payment: true,
        sport: true,
        user: true
      }
    });

    if (!isAdmin && booking.userId !== requestUserId) {
      throw new ApiError(403, "Forbidden", true, "FORBIDDEN");
    }

    return booking;
  },

  async cancel(requestUserId: string, bookingId: string, reason?: string) {
    const booking = await prisma.booking.findUniqueOrThrow({
      where: { id: bookingId },
      include: {
        slot: true,
        venue: true,
        payment: true,
        user: true
      }
    });

    if (booking.userId !== requestUserId) {
      throw new ApiError(403, "Forbidden", true, "FORBIDDEN");
    }

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new ApiError(400, "Only confirmed bookings can be cancelled", true, "INVALID_BOOKING_STATE");
    }

    const refundAmount = calculateRefundAmount(booking.slot.date, booking.slot.startTime, booking.totalAmount);

    let refundStatus: RefundStatus | null = null;
    let refundId: string | null = null;

    if (refundAmount > 0) {
      refundStatus = RefundStatus.INITIATED;
      if (isRazorpayConfigured && razorpay && booking.payment?.razorpayPaymentId) {
        const refund = await razorpay.payments.refund(booking.payment.razorpayPaymentId, {
          amount: Math.round(refundAmount * 100)
        });
        refundId = refund.id;
      } else {
        refundId = `rfnd_mock_${crypto.randomBytes(6).toString("hex")}`;
      }
    }

    await prisma.$transaction([
      prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: refundAmount > 0 ? BookingStatus.REFUND_INITIATED : BookingStatus.CANCELLED,
          cancelReason: reason,
          refundAmount,
          refundStatus
        }
      }),
      prisma.slot.update({
        where: { id: booking.slotId },
        data: {
          status: SlotStatus.AVAILABLE,
          lockedUntil: null
        }
      }),
      ...(booking.payment
        ? [
            prisma.payment.update({
              where: { id: booking.payment.id },
              data: {
                razorpayRefundId: refundId,
                status: refundAmount > 0 ? PaymentStatus.REFUNDED : booking.payment.status
              }
            })
          ]
        : [])
    ]);

    await unlockSlot(booking.slot.venueId, booking.slot.date, booking.slot.startTime, booking.slot.sportId);

    void sendToUser(booking.userId, {
      title: "Booking cancelled",
      body: `${booking.venue.name} booking cancelled successfully.`,
      data: { bookingId: booking.id }
    });
    void sendCancellationEmail(booking.user, { ...booking, cancelReason: reason } as never, booking.venue, refundAmount);
    await prisma.notification.create({
      data: {
        userId: booking.userId,
        type: NotificationType.BOOKING_CANCELLED,
        title: "Booking cancelled",
        body: `${booking.bookingRef} has been cancelled.`,
        data: { refundAmount, bookingId: booking.id }
      }
    });

    return {
      cancelled: true,
      refundAmount,
      refundStatus: refundStatus ?? null
    };
  }
};
