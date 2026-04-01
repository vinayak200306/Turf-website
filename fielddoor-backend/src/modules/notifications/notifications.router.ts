import { Router } from "express";

import { auth } from "@middleware/auth";
import { asyncHandler } from "@utils/asyncHandler";
import { notificationsController } from "./notifications.controller";

const router = Router();

router.use(auth);
router.get("/", asyncHandler(notificationsController.list));
router.patch("/:id/read", asyncHandler(notificationsController.read));

export default router;
