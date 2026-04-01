import { Router } from "express";
import { z } from "zod";

import { auth } from "@middleware/auth";
import { validate } from "@middleware/validate";
import { asyncHandler } from "@utils/asyncHandler";
import { uploadsController } from "./uploads.controller";

const schema = z.object({
  filename: z.string().min(1),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  folder: z.enum(["venues", "avatars"])
});

const router = Router();

router.post("/presigned-url", auth, validate(schema), asyncHandler(uploadsController.presignedUrl));

export default router;
