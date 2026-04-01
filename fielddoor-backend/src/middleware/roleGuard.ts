import type { NextFunction, Request, Response } from "express";
import type { Role } from "@prisma/client";

import { ApiError } from "@utils/ApiError";

export const roleGuard =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, "Authentication required", true, "AUTH_REQUIRED"));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, "Forbidden", true, "FORBIDDEN"));
    }

    return next();
  };
