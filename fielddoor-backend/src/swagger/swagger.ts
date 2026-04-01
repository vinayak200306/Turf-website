import path from "path";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import type { Express } from "express";

const spec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Field Door API",
      version: "1.0.0",
      description: "Production backend for Field Door turf booking platform"
    },
    servers: [{ url: "http://localhost:3000" }]
  },
  apis: [path.resolve(process.cwd(), "src/modules/**/*.ts")]
});

export const setupSwagger = (app: Express) => {
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(spec));
};
