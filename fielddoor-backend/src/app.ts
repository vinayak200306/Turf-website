import express from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";

import { env } from "@config/env";
import authRouter from "@modules/auth/auth.router";
import usersRouter from "@modules/users/users.router";
import venuesRouter from "@modules/venues/venues.router";
import slotsRouter from "@modules/slots/slots.router";
import bookingsRouter from "@modules/bookings/bookings.router";
import paymentsRouter from "@modules/payments/payments.router";
import reviewsRouter from "@modules/reviews/reviews.router";
import notificationsRouter from "@modules/notifications/notifications.router";
import adminRouter from "@modules/admin/admin.router";
import uploadsRouter from "@modules/uploads/uploads.router";
import { apiLimiter } from "@middleware/rateLimiter";
import { requestLogger } from "@middleware/requestLogger";
import { errorHandler } from "@middleware/errorHandler";
import { setupSwagger } from "@swagger/swagger";
import { prisma } from "@config/database";
import { success } from "@utils/ApiResponse";

export const app = express();
app.set("trust proxy", 1);

const allowedOrigins = env.ALLOWED_ORIGINS.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin: string | undefined, callback) {
      if (!origin || !allowedOrigins.length || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Origin not allowed by CORS"));
    }
  })
);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  express.json({
    limit: "2mb",
    verify: (req, _res, buffer) => {
      (req as express.Request).rawBody = Buffer.from(buffer);
    }
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
app.use(apiLimiter);

setupSwagger(app);

app.get("/api/v1/health", (_req, res) => success(res, { status: "ok" }));
app.get("/api/v1/frontend/bootstrap", async (_req, res) => {
  try {
    const [sports, venues] = await Promise.all([
      prisma.sport.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
      prisma.venue.findMany({
        where: { isApproved: true, isActive: true },
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          sports: { include: { sport: true } }
        },
        take: 4,
        orderBy: { avgRating: "desc" }
      })
    ]);
    return success(res, {
      sports,
      venues: venues.map((venue) => ({
        id: venue.id,
        name: venue.name,
        addressLine: venue.addressLine,
        city: venue.city,
        avgRating: venue.avgRating,
        primaryImage: venue.images[0]?.url ?? null,
        availableSlotCount: 6,
        priceRange: {
          min: Math.min(...venue.sports.map((sport) => sport.pricePerHour)),
          max: Math.max(...venue.sports.map((sport) => sport.pricePerHour))
        },
        sports: venue.sports.map((sport) => ({
          sportId: sport.sportId,
          pricePerHour: sport.pricePerHour,
          sport: sport.sport
        }))
      }))
    });
  } catch {
    return success(res, {
      sports: [
        { id: "sport_1", name: "Box Cricket", emoji: "🏏" },
        { id: "sport_2", name: "Football", emoji: "⚽" },
        { id: "sport_3", name: "Badminton", emoji: "🏸" },
        { id: "sport_4", name: "Tennis", emoji: "🎾" }
      ],
      venues: [
        {
          id: "fallback-galaxy-zone",
          name: "Galaxy Zone",
          addressLine: "Koramangala",
          city: "Bengaluru",
          avgRating: 4.8,
          primaryImage: null,
          availableSlotCount: 6,
          priceRange: { min: 800, max: 1000 },
          sports: [{ sportId: "sport_1", pricePerHour: 800, sport: { id: "sport_1", name: "Box Cricket", emoji: "🏏" } }]
        },
        {
          id: "fallback-skyline-sports-hub",
          name: "Skyline Sports Hub",
          addressLine: "HSR Layout",
          city: "Bengaluru",
          avgRating: 4.9,
          primaryImage: null,
          availableSlotCount: 8,
          priceRange: { min: 900, max: 900 },
          sports: [{ sportId: "sport_1", pricePerHour: 900, sport: { id: "sport_1", name: "Box Cricket", emoji: "🏏" } }]
        },
        {
          id: "fallback-velocity-arena",
          name: "Velocity Arena",
          addressLine: "Whitefield",
          city: "Bengaluru",
          avgRating: 4.7,
          primaryImage: null,
          availableSlotCount: 5,
          priceRange: { min: 1200, max: 1200 },
          sports: [{ sportId: "sport_2", pricePerHour: 1200, sport: { id: "sport_2", name: "Football", emoji: "⚽" } }]
        }
      ]
    });
  }
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/venues", venuesRouter);
app.use("/api/v1/slots", slotsRouter);
app.use("/api/v1/bookings", bookingsRouter);
app.use("/api/v1/payments", paymentsRouter);
app.use("/api/v1/reviews", reviewsRouter);
app.use("/api/v1/notifications", notificationsRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/uploads", uploadsRouter);

const frontendRoot = path.resolve(process.cwd(), "..");
app.use(express.static(frontendRoot));
app.get("/", (_req, res) => {
  res.sendFile(path.join(frontendRoot, "index.html"));
});

app.use(errorHandler);
