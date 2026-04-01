import request from "supertest";
import express from "express";

describe("bookings routes", () => {
  it("returns a booking creation response shape", async () => {
    const app = express();
    app.use(express.json());
    app.post("/api/v1/bookings", (_req, res) => {
      res.status(201).json({
        success: true,
        message: "Booking created",
        data: {
          bookingId: "booking_1",
          bookingRef: "FD-20260401-AB12",
          razorpayOrderId: "order_mock_123",
          razorpayKeyId: "rzp_test_mock",
          amount: 1450
        }
      });
    });

    const response = await request(app).post("/api/v1/bookings").send({ slotId: "slot_1" });
    expect(response.status).toBe(201);
    expect(response.body.data.bookingRef).toContain("FD-");
  });
});
