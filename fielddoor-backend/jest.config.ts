import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  moduleFileExtensions: ["ts", "js", "json"],
  clearMocks: true,
  collectCoverageFrom: ["src/**/*.ts", "!src/types/**/*.ts", "!src/swagger/**/*.ts"],
  setupFiles: ["dotenv/config"]
};

export default config;
