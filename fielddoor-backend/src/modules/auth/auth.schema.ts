import { z } from "zod";

const countryCodeSchema = z.string().regex(/^\+\d{1,4}$/, "Invalid country code");
const phoneSchema = z.string().regex(/^\d{10,12}$/, "Invalid phone number");

export const sendOtpSchema = z.object({
  phone: phoneSchema,
  countryCode: countryCodeSchema.default("+91")
});

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  countryCode: countryCodeSchema.default("+91"),
  otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits")
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10)
});
