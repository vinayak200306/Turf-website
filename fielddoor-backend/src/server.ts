import http from "http";

import { prisma } from "@config/database";
import { env } from "@config/env";
import { redis } from "@config/redis";
import { registerJobs } from "./jobs/index";
import logger from "@utils/logger";
import { app } from "./app";

const server = http.createServer(app);

const shutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully.`);
  server.close(async () => {
    await prisma.$disconnect();
    await redis.quit();
    process.exit(0);
  });
};

server.listen(env.PORT, () => {
  logger.info(`Field Door backend listening on ${env.PORT}`);
  registerJobs();
});

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
