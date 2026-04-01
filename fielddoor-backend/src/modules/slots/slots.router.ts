import { Router } from "express";

import { auth } from "@middleware/auth";
import { validate } from "@middleware/validate";
import { asyncHandler } from "@utils/asyncHandler";
import { slotsController } from "./slots.controller";
import { getSlotsSchema, lockSlotSchema } from "./slots.schema";

const router = Router();

router.get("/", validate(getSlotsSchema, "query"), asyncHandler(slotsController.getSlots));
router.post("/lock", auth, validate(lockSlotSchema), asyncHandler(slotsController.lock));
router.delete("/lock/:slotId", auth, asyncHandler(slotsController.release));

export default router;
