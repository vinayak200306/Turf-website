import { Router } from "express";

import { auth } from "@middleware/auth";
import { roleGuard } from "@middleware/roleGuard";
import { asyncHandler } from "@utils/asyncHandler";
import { adminController } from "./admin.controller";

const router = Router();

router.use(auth, roleGuard("ADMIN"));
router.get("/dashboard", asyncHandler(adminController.dashboard));
router.get("/venues", asyncHandler(adminController.venues));
router.patch("/venues/:id/approve", asyncHandler(adminController.approveVenue));
router.get("/users", asyncHandler(adminController.users));
router.patch("/users/:id/status", asyncHandler(adminController.updateUserStatus));
router.get("/bookings", asyncHandler(adminController.bookings));
router.get("/payments", asyncHandler(adminController.payments));

export default router;
