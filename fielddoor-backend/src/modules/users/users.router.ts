import { Router } from "express";

import { auth } from "@middleware/auth";
import { validate } from "@middleware/validate";
import { asyncHandler } from "@utils/asyncHandler";
import { usersController } from "./users.controller";
import {
  bookingsQuerySchema,
  fcmTokenSchema,
  notificationQuerySchema,
  updateProfileSchema
} from "./users.schema";

const router = Router();

router.use(auth);
router.get("/me", asyncHandler(usersController.me));
router.patch("/me", validate(updateProfileSchema), asyncHandler(usersController.updateMe));
router.post("/me/fcm-token", validate(fcmTokenSchema), asyncHandler(usersController.saveFcmToken));
router.get("/me/bookings", validate(bookingsQuerySchema, "query"), asyncHandler(usersController.myBookings));
router.get("/me/saved-venues", asyncHandler(usersController.savedVenues));
router.post("/me/saved-venues/:venueId", asyncHandler(usersController.toggleSavedVenue));
router.get(
  "/me/notifications",
  validate(notificationQuerySchema, "query"),
  asyncHandler(usersController.notifications)
);
router.patch("/me/notifications/read-all", asyncHandler(usersController.readAllNotifications));

export default router;
