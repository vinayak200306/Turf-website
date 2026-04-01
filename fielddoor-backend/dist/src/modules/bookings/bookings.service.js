"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingsService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const client_1 = require("@prisma/client");
const database_1 = require("../../config/database");
const env_1 = require("../../config/env");
const razorpay_1 = require("../../config/razorpay");
const ApiError_1 = require("../../utils/ApiError");
const generateBookingId_1 = require("../../utils/generateBookingId");
const sendEmail_1 = require("../../utils/sendEmail");
const sendPushNotif_1 = require("../../utils/sendPushNotif");
const slotLock_1 = require("../../utils/slotLock");
const upgradeMemberTier = (totalBookings) => {
    if (totalBookings >= 25) {
        return client_1.MemberTier.PLATINUM;
    }
    if (totalBookings >= 15) {
        return client_1.MemberTier.GOLD;
    }
    if (totalBookings >= 7) {
        return client_1.MemberTier.SILVER;
    }
    return client_1.MemberTier.BRONZE;
};
const slotDateTime = (date, time) => new Date(`${date}T${time}:00`);
const calculateRefundAmount = (bookingDate, bookingStartTime, totalAmount) => {
    const slotStart = slotDateTime(bookingDate, bookingStartTime);
    const hoursUntil = (slotStart.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntil > env_1.env.CANCELLATION_FULL_REFUND_HOURS) {
        return totalAmount;
    }
    if (hoursUntil >= env_1.env.CANCELLATION_PARTIAL_REFUND_HOURS) {
        return Number((totalAmount * env_1.env.CANCELLATION_PARTIAL_REFUND_PCT).toFixed(2));
    }
    return 0;
};
const createOrder = async (amount, receipt) => {
    if (razorpay_1.isRazorpayConfigured && razorpay_1.razorpay) {
        return razorpay_1.razorpay.orders.create({
            amount: Math.round(amount * 100),
            currency: "INR",
            receipt
        });
    }
    return {
        id: `order_mock_${crypto_1.default.randomBytes(6).toString("hex")}`,
        amount: Math.round(amount * 100),
        currency: "INR",
        receipt
    };
};
exports.bookingsService = {
    upgradeMemberTier,
    async create(userId, slotId) {
        const slot = await database_1.prisma.slot.findUniqueOrThrow({
            where: { id: slotId },
            include: {
                venue: true,
                sport: true
            }
        });
        if (slot.status !== client_1.SlotStatus.LOCKED) {
            throw new ApiError_1.ApiError(409, "Slot is not locked", true, "SLOT_UNLOCKED");
        }
        const lockValue = await (0, slotLock_1.isSlotLocked)(slot.venueId, slot.date, slot.startTime, slot.sportId);
        if (lockValue !== userId) {
            throw new ApiError_1.ApiError(403, "Slot lock belongs to another user", true, "LOCK_MISMATCH");
        }
        const slotFee = slot.priceTotal;
        const gstAmount = Number((slotFee * env_1.env.GST_RATE).toFixed(2));
        const convenienceFee = env_1.env.CONVENIENCE_FEE;
        const totalAmount = Number((slotFee + gstAmount + convenienceFee).toFixed(2));
        const bookingRef = (0, generateBookingId_1.generateBookingId)();
        const booking = await database_1.prisma.booking.create({
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
                status: client_1.BookingStatus.PENDING
            }
        });
        const order = await createOrder(totalAmount, bookingRef);
        await database_1.prisma.payment.create({
            data: {
                bookingId: booking.id,
                razorpayOrderId: order.id,
                amount: totalAmount,
                status: client_1.PaymentStatus.CREATED
            }
        });
        return {
            bookingId: booking.id,
            bookingRef: booking.bookingRef,
            razorpayOrderId: order.id,
            razorpayKeyId: env_1.env.RAZORPAY_KEY_ID || "rzp_test_mock",
            amount: totalAmount
        };
    },
    async getById(requestUserId, bookingId, isAdmin = false) {
        const booking = await database_1.prisma.booking.findUniqueOrThrow({
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
            throw new ApiError_1.ApiError(403, "Forbidden", true, "FORBIDDEN");
        }
        return booking;
    },
    async cancel(requestUserId, bookingId, reason) {
        const booking = await database_1.prisma.booking.findUniqueOrThrow({
            where: { id: bookingId },
            include: {
                slot: true,
                venue: true,
                payment: true,
                user: true
            }
        });
        if (booking.userId !== requestUserId) {
            throw new ApiError_1.ApiError(403, "Forbidden", true, "FORBIDDEN");
        }
        if (booking.status !== client_1.BookingStatus.CONFIRMED) {
            throw new ApiError_1.ApiError(400, "Only confirmed bookings can be cancelled", true, "INVALID_BOOKING_STATE");
        }
        const refundAmount = calculateRefundAmount(booking.slot.date, booking.slot.startTime, booking.totalAmount);
        let refundStatus = null;
        let refundId = null;
        if (refundAmount > 0) {
            refundStatus = client_1.RefundStatus.INITIATED;
            if (razorpay_1.isRazorpayConfigured && razorpay_1.razorpay && booking.payment?.razorpayPaymentId) {
                const refund = await razorpay_1.razorpay.payments.refund(booking.payment.razorpayPaymentId, {
                    amount: Math.round(refundAmount * 100)
                });
                refundId = refund.id;
            }
            else {
                refundId = `rfnd_mock_${crypto_1.default.randomBytes(6).toString("hex")}`;
            }
        }
        await database_1.prisma.$transaction([
            database_1.prisma.booking.update({
                where: { id: booking.id },
                data: {
                    status: refundAmount > 0 ? client_1.BookingStatus.REFUND_INITIATED : client_1.BookingStatus.CANCELLED,
                    cancelReason: reason,
                    refundAmount,
                    refundStatus
                }
            }),
            database_1.prisma.slot.update({
                where: { id: booking.slotId },
                data: {
                    status: client_1.SlotStatus.AVAILABLE,
                    lockedUntil: null
                }
            }),
            ...(booking.payment
                ? [
                    database_1.prisma.payment.update({
                        where: { id: booking.payment.id },
                        data: {
                            razorpayRefundId: refundId,
                            status: refundAmount > 0 ? client_1.PaymentStatus.REFUNDED : booking.payment.status
                        }
                    })
                ]
                : [])
        ]);
        await (0, slotLock_1.unlockSlot)(booking.slot.venueId, booking.slot.date, booking.slot.startTime, booking.slot.sportId);
        void (0, sendPushNotif_1.sendToUser)(booking.userId, {
            title: "Booking cancelled",
            body: `${booking.venue.name} booking cancelled successfully.`,
            data: { bookingId: booking.id }
        });
        void (0, sendEmail_1.sendCancellationEmail)(booking.user, { ...booking, cancelReason: reason }, booking.venue, refundAmount);
        await database_1.prisma.notification.create({
            data: {
                userId: booking.userId,
                type: client_1.NotificationType.BOOKING_CANCELLED,
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
