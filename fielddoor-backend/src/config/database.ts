import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __fielddoorPrisma: PrismaClient | undefined;
}

export const prisma =
  global.__fielddoorPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["warn", "error"]
  });

if (process.env.NODE_ENV !== "production") {
  global.__fielddoorPrisma = prisma;
}
