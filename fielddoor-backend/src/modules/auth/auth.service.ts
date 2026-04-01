import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";

import { prisma } from "@config/database";
import { env } from "@config/env";
import { redis } from "@config/redis";
import { ApiError } from "@utils/ApiError";
import { generateOTP } from "@utils/generateOTP";
import logger from "@utils/logger";
import type { AuthTokens, JwtPayload } from "../../types";

const normalizePhone = (phone: string, countryCode: string) => `${countryCode}${phone}`;

const signAccessToken = (userId: string, role: Role) =>
  jwt.sign({ userId, role, tokenType: "access" }, env.ACCESS_TOKEN_SECRET, {
    expiresIn: env.ACCESS_TOKEN_EXPIRY as jwt.SignOptions["expiresIn"]
  });

const signRefreshToken = (userId: string, role: Role) =>
  jwt.sign({ userId, role, tokenType: "refresh" }, env.REFRESH_TOKEN_SECRET, {
    expiresIn: env.REFRESH_TOKEN_EXPIRY as jwt.SignOptions["expiresIn"]
  });

const buildTokens = async (userId: string, role: Role): Promise<AuthTokens> => {
  const accessToken = signAccessToken(userId, role);
  const refreshToken = signRefreshToken(userId, role);
  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: hashedRefreshToken }
  });

  return { accessToken, refreshToken };
};

export const authService = {
  normalizePhone,

  async sendOtp(phone: string, countryCode: string) {
    const fullPhone = normalizePhone(phone, countryCode);
    const otpRateKey = `otp:rate:${fullPhone}`;
    const otpRateCount = await redis.incr(otpRateKey);
    if (otpRateCount === 1) {
      await redis.expire(otpRateKey, 600);
    }

    if (otpRateCount > 3) {
      throw new ApiError(429, "OTP request limit exceeded", true, "OTP_RATE_LIMIT");
    }

    const user = await prisma.user.upsert({
      where: { phone: fullPhone },
      update: { countryCode },
      create: { phone: fullPhone, countryCode }
    });

    const plainOtp = generateOTP();
    const hashedOtp = await bcrypt.hash(plainOtp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.otpLog.create({
      data: {
        userId: user.id,
        otp: hashedOtp,
        expiresAt
      }
    });

    logger.info(`[OTP] Phone: ${fullPhone} | OTP: ${plainOtp}`);

    return {
      success: true,
      message: "OTP sent",
      expiresIn: 600
    };
  },

  async verifyOtp(phone: string, countryCode: string, otp: string) {
    const fullPhone = normalizePhone(phone, countryCode);
    const user = await prisma.user.findUnique({
      where: { phone: fullPhone }
    });

    if (!user) {
      throw new ApiError(404, "User not found", true, "USER_NOT_FOUND");
    }

    const otpLog = await prisma.otpLog.findFirst({
      where: {
        userId: user.id,
        verified: false
      },
      orderBy: { createdAt: "desc" }
    });

    if (!otpLog) {
      throw new ApiError(400, "OTP not found", true, "OTP_NOT_FOUND");
    }

    const attemptKey = `otp:attempts:${fullPhone}`;
    const currentAttempts = Number((await redis.get(attemptKey)) ?? "0");
    if (currentAttempts >= 5 || otpLog.attempts >= 5) {
      throw new ApiError(429, "Too many incorrect OTP attempts", true, "OTP_LOCKED");
    }

    if (otpLog.expiresAt.getTime() < Date.now()) {
      throw new ApiError(400, "OTP expired", true, "OTP_EXPIRED");
    }

    const isMatch = await bcrypt.compare(otp, otpLog.otp);
    if (!isMatch) {
      const nextAttempts = currentAttempts + 1;
      await redis.set(attemptKey, String(nextAttempts), "EX", 600);
      await prisma.otpLog.update({
        where: { id: otpLog.id },
        data: { attempts: otpLog.attempts + 1 }
      });
      throw new ApiError(400, "Invalid OTP", true, "OTP_INVALID");
    }

    await prisma.otpLog.update({
      where: { id: otpLog.id },
      data: { verified: true }
    });
    await redis.del(attemptKey);

    const tokens = await buildTokens(user.id, user.role);

    return {
      ...tokens,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role
      }
    };
  },

  async refreshToken(refreshToken: string) {
    const payload = jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET) as JwtPayload;
    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    });

    if (!user?.refreshToken) {
      throw new ApiError(401, "Invalid refresh token", true, "INVALID_REFRESH");
    }

    const isValid = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isValid) {
      throw new ApiError(401, "Invalid refresh token", true, "INVALID_REFRESH");
    }

    return {
      accessToken: signAccessToken(user.id, user.role)
    };
  },

  async logout(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null }
    });

    await redis.del(`user:session:${userId}`);
    return { success: true };
  },

  generateMockPaymentSignature(orderId: string, paymentId: string) {
    return crypto
      .createHmac("sha256", env.RAZORPAY_KEY_SECRET || "fielddoor_local_secret")
      .update(`${orderId}|${paymentId}`)
      .digest("hex");
  }
};
