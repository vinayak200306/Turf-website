import { Router } from "express";

import { auth } from "@middleware/auth";
import { paymentLimiter } from "@middleware/rateLimiter";
import { validate } from "@middleware/validate";
import { asyncHandler } from "@utils/asyncHandler";
import { paymentsController } from "./payments.controller";
import { verifyPaymentSchema } from "./payments.schema";

const router = Router();

router.use(paymentLimiter);
router.post("/verify", auth, validate(verifyPaymentSchema), asyncHandler(paymentsController.verify));
router.post("/webhook", asyncHandler(paymentsController.webhook));

export default router;
