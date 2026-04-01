import type { Response } from "express";

export const success = <T>(res: Response, data: T, message = "OK", statusCode = 200) =>
  res.status(statusCode).json({
    success: true,
    message,
    data
  });

export const paginated = <T>(
  res: Response,
  data: T,
  page: number,
  limit: number,
  total: number,
  statusCode = 200
) =>
  res.status(statusCode).json({
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  });
