"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadsController = void 0;
const path_1 = __importDefault(require("path"));
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const uuid_1 = require("uuid");
const env_1 = require("../../config/env");
const s3_1 = require("../../config/s3");
const ApiError_1 = require("../../utils/ApiError");
const allowed = ["image/jpeg", "image/png", "image/webp"];
exports.uploadsController = {
    async presignedUrl(req, res) {
        const { filename, contentType, folder } = req.body;
        if (!allowed.includes(contentType)) {
            throw new ApiError_1.ApiError(422, "Unsupported file type", true, "INVALID_CONTENT_TYPE");
        }
        const extension = path_1.default.extname(filename) || (contentType === "image/png" ? ".png" : ".jpg");
        const key = `${folder}/${req.user.id}/${(0, uuid_1.v4)()}${extension}`;
        const command = new client_s3_1.PutObjectCommand({
            Bucket: env_1.env.AWS_S3_BUCKET,
            Key: key,
            ContentType: contentType
        });
        const uploadUrl = await (0, s3_request_presigner_1.getSignedUrl)(s3_1.s3Client, command, { expiresIn: 300 });
        const baseUrl = env_1.env.CDN_URL || `https://${env_1.env.AWS_S3_BUCKET}.s3.${env_1.env.AWS_REGION}.amazonaws.com`;
        return res.status(200).json({
            success: true,
            message: "Presigned URL generated",
            data: {
                uploadUrl,
                fileUrl: `${baseUrl.replace(/\/$/, "")}/${key}`
            }
        });
    }
};
