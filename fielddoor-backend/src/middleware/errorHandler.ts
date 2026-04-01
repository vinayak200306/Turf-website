import { Prisma } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { ApiError } from "@utils/ApiError";
import logger from "@utils/logger";

export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      code: error.code
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const fields = Array.isArray(error.meta?.target) ? error.meta?.target.join(", ") : "field";
      return res.status(409).json({
        success: false,
        message: `Duplicate value for ${fields}`,
        code: "UNIQUE_CONSTRAINT"
      });
    }

    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Record not found",
        code: "NOT_FOUND"
      });
    }
  }

  if (error instanceof jwt.JsonWebTokenError) {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
      code: "INVALID_TOKEN"
    });
  }

  if (error instanceof jwt.TokenExpiredError) {
    return res.status(401).json({
      success: false,
      message: "Token expired",
      code: "TOKEN_EXPIRED"
    });
  }

  logger.error("Unhandled server error", { error, stack: error.stack });
  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
    code: "INTERNAL_ERROR"
  });
};
