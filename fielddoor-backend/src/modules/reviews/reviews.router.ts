import { Router } from "express";

import { auth } from "@middleware/auth";
import { validate } from "@middleware/validate";
import { asyncHandler } from "@utils/asyncHandler";
import { reviewsController } from "./reviews.controller";
import { createReviewSchema, venueReviewsQuerySchema } from "./reviews.schema";

const router = Router();

router.post("/", auth, validate(createReviewSchema), asyncHandler(reviewsController.create));
router.get(
  "/venue/:venueId",
  validate(venueReviewsQuerySchema, "query"),
  asyncHandler(reviewsController.listVenueReviews)
);

export default router;
