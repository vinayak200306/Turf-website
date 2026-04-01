"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const asyncHandler_1 = require("../../utils/asyncHandler");
const uploads_controller_1 = require("./uploads.controller");
const schema = zod_1.z.object({
    filename: zod_1.z.string().min(1),
    contentType: zod_1.z.enum(["image/jpeg", "image/png", "image/webp"]),
    folder: zod_1.z.enum(["venues", "avatars"])
});
const router = (0, express_1.Router)();
router.post("/presigned-url", auth_1.auth, (0, validate_1.validate)(schema), (0, asyncHandler_1.asyncHandler)(uploads_controller_1.uploadsController.presignedUrl));
exports.default = router;
