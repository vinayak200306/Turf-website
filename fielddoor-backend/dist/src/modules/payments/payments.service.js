"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentsService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const client_1 = require("@prisma/client");
const database_1 = require("../../config/database");
const env_1 = require("../../config/env");
const razorpay_1 = require("../../config/razorpay");
const ApiError_1 = require("../../utils/ApiError");
const sendEmail_1 = require("../../utils/sendEmail");
const sendPushNotif_1 = require("../../utils/sendPushNotif");
const slotLock_1 = require("../../utils/slotLock");
const logger_1 = __importDefault(require("../../utils/logger"));
const bookings_service_1 = require("../bookings/bookings.service");
const verifySignature = (orderId, paymentId, signature) => {
    const expectedSig = crypto_1.default
        .createHmac("sha256", env_1.env.RAZORPAY_KEY_SECRET || "fielddoor_local_secret")
        .update(`${orderId}|${paymentId}`)
        .digest("hex");
    return expectedSig === signature;
};
const applyConfirmation = async (bookingId, paymentPatch) => {
    const booking = await database_1.prisma.booking.findUniqueOrThrow({
        where: { id: bookingId },
        include: {
            payment: true,
            slot: true,
            user: true,
            venue: true,
            sport: true
        }
    });
    if (booking.status === client_1.BookingStatus.CONFIRMED && booking.payment?.status === client_1.PaymentStatus.CAPTURED) {
        return booking;
    }
    const totalBookings = booking.user.totalBookings + 1;
    const memberTier = bookings_service_1.bookingsService.upgradeMemberTier(totalBookings);
    await database_1.prisma.$transaction([
        database_1.prisma.payment.update({
            where: { bookingId },
            data: {
                ...paymentPatch,
                status: client_1.PaymentStatus.CAPTURED,
                paidAt: new Date()
            }
        }),
        database_1.prisma.booking.update({
            where: { id: bookingId },
            data: { status: client_1.BookingStatus.CONFIRMED }
        }),
        database_1.prisma.slot.update({
            where: { id: booking.slotId },
            data: { status: "BOOKED", lockedUntil: null }
        }),
        database_1.prisma.user.update({
            where: { id: booking.userId },
            data: {
                totalBookings,
                memberTier
            }
        })
    ]);
    await (0, slotLock_1.unlockSlot)(booking.slot.venueId, booking.slot.date, booking.slot.startTime, booking.slot.sportId);
    await database_1.prisma.notification.create({
        data: {
            userId: booking.userId,
            type: client_1.NotificationType.BOOKING_CONFIRMED,
            title: "Booking confirmed",
            body: `${booking.venue.name} on ${booking.slot.date} at ${booking.slot.startTime}`,
            data: { bookingId }
        }
    });
    void (0, sendPushNotif_1.sendToUser)(booking.userId, {
        title: "Booking confirmed",
        body: `${booking.venue.name} · ${booking.slot.startTime}`,
        data: { bookingId }
    });
    void (0, sendEmail_1.sendBookingConfirmationEmail)({ ...booking.user, totalBookings, memberTier }, booking, booking.slot, booking.venue, booking.sport);
    return database_1.prisma.booking.findUniqueOrThrow({
        where: { id: bookingId },
        include: {
            payment: true,
            slot: true,
            venue: true,
            sport: true
        }
    });
};
exports.paymentsService = {
    async verifyPayment(userId, bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature) {
        const booking = await database_1.prisma.booking.findUniqueOrThrow({
            where: { id: bookingId },
            include: { payment: true }
        });
        if (booking.userId !== userId) {
            throw new ApiError_1.ApiError(403, "Forbidden", true, "FORBIDDEN");
        }
        const isMock = !razorpay_1.isRazorpayConfigured && razorpayOrderId.startsWith("order_mock_");
        const signatureValid = isMock ? true : verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
        if (!signatureValid) {
            logger_1.default.warn("Potential Razorpay signature mismatch", {
                userId,
                bookingId,
                razorpayOrderId,
                razorpayPaymentId
            });
            throw new ApiError_1.ApiError(400, "Invalid payment signature", true, "INVALID_SIGNATURE");
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
    async handleWebhook(event, entity) {
        if (event === "payment.captured") {
            const orderId = String(entity.order_id);
            const paymentId = String(entity.id);
            const payment = await database_1.prisma.payment.findUnique({
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
            const payment = await database_1.prisma.payment.findUnique({
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
            await database_1.prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: client_1.PaymentStatus.FAILED,
                    failureReason: String(entity.error_description ?? "Payment failed")
                }
            });
            void (0, sendEmail_1.sendPaymentFailureEmail)(payment.booking.user, payment.booking, payment.booking.venue);
            await database_1.prisma.notification.create({
                data: {
                    userId: payment.booking.userId,
                    type: client_1.NotificationType.PAYMENT_FAILED,
                    title: "Payment failed",
                    body: `${payment.booking.bookingRef} payment failed.`,
                    data: { bookingId: payment.bookingId }
                }
            });
            return { processed: true };
        }
        if (event === "refund.processed") {
            const refundId = String(entity.id);
            const payment = await database_1.prisma.payment.findFirst({
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
            await database_1.prisma.$transaction([
                database_1.prisma.payment.update({
                    where: { id: payment.id },
                    data: { status: client_1.PaymentStatus.REFUNDED }
                }),
                database_1.prisma.booking.update({
                    where: { id: payment.bookingId },
                    data: { status: client_1.BookingStatus.CANCELLED, refundStatus: client_1.RefundStatus.PROCESSED }
                })
            ]);
            void (0, sendEmail_1.sendRefundProcessedEmail)(payment.booking.user, payment.booking, payment.booking.refundAmount ?? 0);
            await database_1.prisma.notification.create({
                data: {
                    userId: payment.booking.userId,
                    type: client_1.NotificationType.REFUND_PROCESSED,
                    title: "Refund processed",
                    body: `${payment.booking.bookingRef} refund is processed.`,
                    data: { bookingId: payment.bookingId }
                }
            });
            return { processed: true };
        }
        return { processed: false };
    },
    verifyWebhookSignature(rawBody, signature) {
        const expected = crypto_1.default
            .createHmac("sha256", env_1.env.RAZORPAY_WEBHOOK_SECRET || "fielddoor_webhook_secret")
            .update(rawBody)
            .digest("hex");
        return expected === signature;
    }
};
