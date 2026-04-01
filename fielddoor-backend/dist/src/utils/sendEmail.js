"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendRefundProcessedEmail = exports.sendCancellationEmail = exports.sendPaymentFailureEmail = exports.sendBookingConfirmationEmail = void 0;
const env_1 = require("../config/env");
const mailer_1 = require("../config/mailer");
const formatCurrency_1 = require("./formatCurrency");
const logger_1 = __importDefault(require("./logger"));
const wrap = (title, body) => `
  <div style="font-family:Arial,sans-serif;background:#060912;padding:32px;color:#f0f4ff;">
    <div style="max-width:640px;margin:0 auto;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:20px;overflow:hidden;">
      <div style="padding:24px 24px 12px;">
        <h1 style="margin:0;font-size:28px;letter-spacing:2px;">FIELD DOOR</h1>
        <p style="margin:8px 0 0;color:rgba(240,244,255,0.7);">${title}</p>
      </div>
      <div style="padding:24px;">
        ${body}
      </div>
      <div style="padding:0 24px 24px;color:rgba(240,244,255,0.6);font-size:12px;">
        See you on the field! - Team Field Door
      </div>
    </div>
  </div>
`;
const sendMailSafe = async (to, subject, html) => {
    try {
        if (!to || !env_1.env.SMTP_USER || !env_1.env.SMTP_PASS) {
            logger_1.default.warn("Email skipped because SMTP is not configured", { to, subject });
            return;
        }
        await mailer_1.mailer.sendMail({
            from: env_1.env.EMAIL_FROM,
            to,
            subject,
            html
        });
    }
    catch (error) {
        logger_1.default.error("Email send failed", { error, to, subject });
    }
};
const sendBookingConfirmationEmail = async (user, booking, slot, venue, sport) => {
    const html = wrap("Your booking is confirmed! 🎉", `
      <p style="margin-top:0;">Booking Reference: <strong>${booking.bookingRef}</strong></p>
      <p>Venue: <strong>${venue.name}</strong>, ${venue.addressLine}, ${venue.city}</p>
      <p>Sport: <strong>${sport.name}</strong></p>
      <p>Date: <strong>${slot.date}</strong> | Time: <strong>${slot.startTime} - ${slot.endTime}</strong></p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;">
        <tr><td style="padding:8px 0;">Slot Fee</td><td style="padding:8px 0;text-align:right;">${(0, formatCurrency_1.formatCurrency)(booking.slotFee)}</td></tr>
        <tr><td style="padding:8px 0;">GST (18%)</td><td style="padding:8px 0;text-align:right;">${(0, formatCurrency_1.formatCurrency)(booking.gstAmount)}</td></tr>
        <tr><td style="padding:8px 0;">Convenience Fee</td><td style="padding:8px 0;text-align:right;">${(0, formatCurrency_1.formatCurrency)(booking.convenienceFee)}</td></tr>
        <tr><td style="padding:8px 0;border-top:1px solid rgba(255,255,255,0.12);"><strong>Total Paid</strong></td><td style="padding:8px 0;border-top:1px solid rgba(255,255,255,0.12);text-align:right;"><strong>${(0, formatCurrency_1.formatCurrency)(booking.totalAmount)}</strong></td></tr>
      </table>
      <p>Member Tier: <strong>${user.memberTier}</strong> | Total Bookings: <strong>${user.totalBookings}</strong></p>
    `);
    await sendMailSafe(user.email ?? "", `Booking Confirmed – ${booking.bookingRef} | Field Door`, html);
};
exports.sendBookingConfirmationEmail = sendBookingConfirmationEmail;
const sendPaymentFailureEmail = async (user, booking, venue) => {
    const html = wrap("Your payment could not be processed", `
      <p>Booking Reference: <strong>${booking.bookingRef}</strong></p>
      <p>Venue: <strong>${venue.name}</strong></p>
      <p>Please try your payment again from your booking page.</p>
      <p><a href="${env_1.env.APP_URL}/bookings/${booking.id}" style="display:inline-block;padding:12px 20px;border-radius:999px;background:#7B61FF;color:#fff;text-decoration:none;">Try Again</a></p>
      <p>Need help? Contact support at support@fielddoor.in</p>
    `);
    await sendMailSafe(user.email ?? "", `Payment Failed – ${booking.bookingRef} | Field Door`, html);
};
exports.sendPaymentFailureEmail = sendPaymentFailureEmail;
const sendCancellationEmail = async (user, booking, venue, refundAmount) => {
    const reason = booking.cancelReason ? `<p>Reason: ${booking.cancelReason}</p>` : "";
    const refundCopy = refundAmount > 0
        ? `A refund of ${(0, formatCurrency_1.formatCurrency)(refundAmount)} will be credited to your original payment method within 5–7 business days.`
        : "No refund is applicable as per our cancellation policy (cancelled < 12 hours before slot).";
    const html = wrap("Your booking has been cancelled", `
      <p>Booking Reference: <strong>${booking.bookingRef}</strong></p>
      <p>Venue: <strong>${venue.name}</strong></p>
      ${reason}
      <p>${refundCopy}</p>
    `);
    await sendMailSafe(user.email ?? "", `Booking Cancelled – ${booking.bookingRef} | Field Door`, html);
};
exports.sendCancellationEmail = sendCancellationEmail;
const sendRefundProcessedEmail = async (user, booking, refundAmount) => {
    const html = wrap("Your refund has been processed", `
      <p>Booking Reference: <strong>${booking.bookingRef}</strong></p>
      <p>Refund Amount: <strong>${(0, formatCurrency_1.formatCurrency)(refundAmount)}</strong></p>
      <p>Funds typically reflect within 5–7 business days.</p>
    `);
    await sendMailSafe(user.email ?? "", `Refund Processed – ${booking.bookingRef} | Field Door`, html);
};
exports.sendRefundProcessedEmail = sendRefundProcessedEmail;
