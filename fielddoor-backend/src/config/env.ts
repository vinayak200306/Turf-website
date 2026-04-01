import "dotenv/config";

import { cleanEnv, host, num, str, url } from "envalid";

export const env = cleanEnv(process.env, {
  NODE_ENV: str({ choices: ["development", "test", "production"], default: "development" }),
  PORT: num({ default: 3000 }),
  APP_URL: url({ default: "http://localhost:3000" }),
  ALLOWED_ORIGINS: str({ default: "" }),
  DATABASE_URL: str(),
  REDIS_URL: str(),
  ACCESS_TOKEN_SECRET: str(),
  REFRESH_TOKEN_SECRET: str(),
  ACCESS_TOKEN_EXPIRY: str({ default: "15m" }),
  REFRESH_TOKEN_EXPIRY: str({ default: "7d" }),
  RAZORPAY_KEY_ID: str({ default: "" }),
  RAZORPAY_KEY_SECRET: str({ default: "" }),
  RAZORPAY_WEBHOOK_SECRET: str({ default: "" }),
  FIREBASE_PROJECT_ID: str({ default: "" }),
  FIREBASE_CLIENT_EMAIL: str({ default: "" }),
  FIREBASE_PRIVATE_KEY: str({ default: "" }),
  AWS_ACCESS_KEY_ID: str({ default: "" }),
  AWS_SECRET_ACCESS_KEY: str({ default: "" }),
  AWS_REGION: str({ default: "ap-south-1" }),
  AWS_S3_BUCKET: str({ default: "fielddoor-media" }),
  CDN_URL: url({ default: "https://media.fielddoor.in" }),
  SMTP_HOST: host({ default: "smtp.gmail.com" }),
  SMTP_PORT: num({ default: 587 }),
  SMTP_USER: str({ default: "" }),
  SMTP_PASS: str({ default: "" }),
  EMAIL_FROM: str({ default: "Field Door <noreply@fielddoor.in>" }),
  SLOT_LOCK_TTL_SECONDS: num({ default: 600 }),
  GST_RATE: num({ default: 0.18 }),
  CONVENIENCE_FEE: num({ default: 20 }),
  CANCELLATION_FULL_REFUND_HOURS: num({ default: 24 }),
  CANCELLATION_PARTIAL_REFUND_HOURS: num({ default: 12 }),
  CANCELLATION_PARTIAL_REFUND_PCT: num({ default: 0.5 })
});

export type AppEnv = typeof env;
