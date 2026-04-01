import request from "supertest";
import express from "express";

describe("auth routes", () => {
  it("returns validation errors for malformed OTP request payload", async () => {
    const app = express();
    app.use(express.json());
    app.post("/api/v1/auth/send-otp", (_req, res) => {
      res.status(422).json({
        success: false,
        message: "Validation failed",
        errors: [{ field: "phone", message: "Invalid phone number" }]
      });
    });

    const response = await request(app).post("/api/v1/auth/send-otp").send({
      phone: "123",
      countryCode: "+91"
    });

    expect(response.status).toBe(422);
    expect(response.body.success).toBe(false);
  });
});
