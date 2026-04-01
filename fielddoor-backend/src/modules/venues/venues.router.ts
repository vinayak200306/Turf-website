import { Router } from "express";

import { optionalAuth } from "@middleware/auth";
import { validate } from "@middleware/validate";
import { asyncHandler } from "@utils/asyncHandler";
import { venuesController } from "./venues.controller";
import { venueListQuerySchema, venueSearchQuerySchema } from "./venues.schema";

const router = Router();

router.get("/search", validate(venueSearchQuerySchema, "query"), asyncHandler(venuesController.search));
router.get("/", optionalAuth, validate(venueListQuerySchema, "query"), asyncHandler(venuesController.list));
router.get("/:id", optionalAuth, asyncHandler(venuesController.details));

export default router;
