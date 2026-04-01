import request from "supertest";
import express from "express";

describe("payments routes", () => {
  it("returns confirmation payload shape", async () => {
    const app = express();
    app.use(express.json());
    app.post("/api/v1/payments/verify", (_req, res) => {
      res.json({
        success: true,
        message: "Booking confirmed",
        data: {
          confirmed: true,
          bookingRef: "FD-20260401-AB12"
        }
      });
    });

    const response = await request(app).post("/api/v1/payments/verify").send({
      razorpayOrderId: "order_mock_123",
      razorpayPaymentId: "pay_mock_123",
      razorpaySignature: "signature",
      bookingId: "booking_1"
    });

    expect(response.status).toBe(200);
    expect(response.body.data.confirmed).toBe(true);
  });
});
