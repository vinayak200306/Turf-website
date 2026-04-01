"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
require("dotenv/config");
const envalid_1 = require("envalid");
exports.env = (0, envalid_1.cleanEnv)(process.env, {
    NODE_ENV: (0, envalid_1.str)({ choices: ["development", "test", "production"], default: "development" }),
    PORT: (0, envalid_1.num)({ default: 3000 }),
    APP_URL: (0, envalid_1.url)({ default: "http://localhost:3000" }),
    ALLOWED_ORIGINS: (0, envalid_1.str)({ default: "" }),
    DATABASE_URL: (0, envalid_1.str)(),
    REDIS_URL: (0, envalid_1.str)(),
    ACCESS_TOKEN_SECRET: (0, envalid_1.str)(),
    REFRESH_TOKEN_SECRET: (0, envalid_1.str)(),
    ACCESS_TOKEN_EXPIRY: (0, envalid_1.str)({ default: "15m" }),
    REFRESH_TOKEN_EXPIRY: (0, envalid_1.str)({ default: "7d" }),
    RAZORPAY_KEY_ID: (0, envalid_1.str)({ default: "" }),
    RAZORPAY_KEY_SECRET: (0, envalid_1.str)({ default: "" }),
    RAZORPAY_WEBHOOK_SECRET: (0, envalid_1.str)({ default: "" }),
    FIREBASE_PROJECT_ID: (0, envalid_1.str)({ default: "" }),
    FIREBASE_CLIENT_EMAIL: (0, envalid_1.str)({ default: "" }),
    FIREBASE_PRIVATE_KEY: (0, envalid_1.str)({ default: "" }),
    AWS_ACCESS_KEY_ID: (0, envalid_1.str)({ default: "" }),
    AWS_SECRET_ACCESS_KEY: (0, envalid_1.str)({ default: "" }),
    AWS_REGION: (0, envalid_1.str)({ default: "ap-south-1" }),
    AWS_S3_BUCKET: (0, envalid_1.str)({ default: "fielddoor-media" }),
    CDN_URL: (0, envalid_1.url)({ default: "https://media.fielddoor.in" }),
    SMTP_HOST: (0, envalid_1.host)({ default: "smtp.gmail.com" }),
    SMTP_PORT: (0, envalid_1.num)({ default: 587 }),
    SMTP_USER: (0, envalid_1.str)({ default: "" }),
    SMTP_PASS: (0, envalid_1.str)({ default: "" }),
    EMAIL_FROM: (0, envalid_1.str)({ default: "Field Door <noreply@fielddoor.in>" }),
    SLOT_LOCK_TTL_SECONDS: (0, envalid_1.num)({ default: 600 }),
    GST_RATE: (0, envalid_1.num)({ default: 0.18 }),
    CONVENIENCE_FEE: (0, envalid_1.num)({ default: 20 }),
    CANCELLATION_FULL_REFUND_HOURS: (0, envalid_1.num)({ default: 24 }),
    CANCELLATION_PARTIAL_REFUND_HOURS: (0, envalid_1.num)({ default: 12 }),
    CANCELLATION_PARTIAL_REFUND_PCT: (0, envalid_1.num)({ default: 0.5 })
});
