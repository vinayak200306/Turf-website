import type {
  Booking,
  Notification,
  Payment,
  Review,
  Slot,
  Sport,
  User,
  Venue
} from "@prisma/client";

export interface JwtPayload {
  userId: string;
  role: string;
  tokenType: "access" | "refresh";
}

export interface PaginatedQuery {
  page?: number;
  limit?: number;
}

export interface BookingEmailContext {
  user: User;
  booking: Booking;
  slot: Slot;
  venue: Venue;
  sport: Sport;
}

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export type UserNotification = Notification;
export type BookingReview = Review;
export type PaymentRecord = Payment;
