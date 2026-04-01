import type { Request, Response } from "express";

import path from "path";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

import { env } from "@config/env";
import { s3Client } from "@config/s3";
import { ApiError } from "@utils/ApiError";

const allowed = ["image/jpeg", "image/png", "image/webp"];

export const uploadsController = {
  async presignedUrl(req: Request, res: Response) {
    const { filename, contentType, folder } = req.body as {
      filename: string;
      contentType: string;
      folder: "venues" | "avatars";
    };

    if (!allowed.includes(contentType)) {
      throw new ApiError(422, "Unsupported file type", true, "INVALID_CONTENT_TYPE");
    }

    const extension = path.extname(filename) || (contentType === "image/png" ? ".png" : ".jpg");
    const key = `${folder}/${req.user!.id}/${uuidv4()}${extension}`;

    const command = new PutObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: key,
      ContentType: contentType
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
    const baseUrl = env.CDN_URL || `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com`;

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
