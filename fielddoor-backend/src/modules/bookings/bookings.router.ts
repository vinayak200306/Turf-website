import { Router } from "express";

import { auth } from "@middleware/auth";
import { validate } from "@middleware/validate";
import { asyncHandler } from "@utils/asyncHandler";
import { bookingsController } from "./bookings.controller";
import { cancelBookingSchema, createBookingSchema } from "./bookings.schema";

const router = Router();

router.use(auth);
router.post("/", validate(createBookingSchema), asyncHandler(bookingsController.create));
router.get("/:id", asyncHandler(bookingsController.details));
router.post("/:id/cancel", validate(cancelBookingSchema), asyncHandler(bookingsController.cancel));

export default router;
