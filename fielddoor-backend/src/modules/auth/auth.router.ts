import { Router } from "express";

import { auth } from "@middleware/auth";
import { authLimiter, otpLimiter } from "@middleware/rateLimiter";
import { validate } from "@middleware/validate";
import { asyncHandler } from "@utils/asyncHandler";
import { authController } from "./auth.controller";
import { refreshSchema, sendOtpSchema, verifyOtpSchema } from "./auth.schema";

const router = Router();

router.use(authLimiter);
router.post("/send-otp", otpLimiter, validate(sendOtpSchema), asyncHandler(authController.sendOtp));
router.post("/verify-otp", validate(verifyOtpSchema), asyncHandler(authController.verifyOtp));
router.post("/refresh", validate(refreshSchema), asyncHandler(authController.refresh));
router.post("/logout", auth, asyncHandler(authController.logout));

export default router;
