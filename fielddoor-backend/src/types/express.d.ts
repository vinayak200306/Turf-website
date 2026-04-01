import type { Role, User } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: Pick<
        User,
        | "id"
        | "phone"
        | "countryCode"
        | "name"
        | "email"
        | "avatarUrl"
        | "role"
        | "isActive"
        | "fcmToken"
        | "walletBalance"
        | "memberTier"
        | "totalBookings"
      > & { role: Role };
      rawBody?: Buffer;
    }
  }
}

export {};
