import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { prisma } from "@config/database";
import { env } from "@config/env";
import { redis } from "@config/redis";
import { ApiError } from "@utils/ApiError";
import type { JwtPayload } from "../types";

const getBearerToken = (req: Request) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  return header.slice(7);
};

const resolveUser = async (userId: string) => {
  const cacheKey = `user:session:${userId}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      phone: true,
      countryCode: true,
      name: true,
      email: true,
      avatarUrl: true,
      role: true,
      isActive: true,
      fcmToken: true,
      walletBalance: true,
      memberTier: true,
      totalBookings: true
    }
  });

  if (user) {
    await redis.set(cacheKey, JSON.stringify(user), "EX", 300);
  }

  return user;
};

export const auth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const token = getBearerToken(req);
    if (!token) {
      throw new ApiError(401, "Authentication required", true, "AUTH_REQUIRED");
    }

    const payload = jwt.verify(token, env.ACCESS_TOKEN_SECRET) as JwtPayload;
    const user = await resolveUser(payload.userId);

    if (!user) {
      throw new ApiError(401, "Invalid session", true, "INVALID_SESSION");
    }

    if (!user.isActive) {
      throw new ApiError(403, "User account is deactivated", true, "ACCOUNT_DISABLED");
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
};

export const optionalAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return next();
    }

    const payload = jwt.verify(token, env.ACCESS_TOKEN_SECRET) as JwtPayload;
    const user = await resolveUser(payload.userId);
    if (user && user.isActive) {
      req.user = user;
    }
    return next();
  } catch {
    return next();
  }
};
