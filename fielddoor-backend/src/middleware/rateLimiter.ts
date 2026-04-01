import rateLimit from "express-rate-limit";

const buildLimiter = (windowMs: number, limit: number, message: string) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message,
      code: "RATE_LIMITED"
    }
  });

export const apiLimiter = buildLimiter(15 * 60 * 1000, 100, "Too many requests");
export const authLimiter = buildLimiter(15 * 60 * 1000, 10, "Too many auth attempts");
export const otpLimiter = buildLimiter(10 * 60 * 1000, 5, "Too many OTP requests");
export const paymentLimiter = buildLimiter(5 * 60 * 1000, 20, "Too many payment requests");
