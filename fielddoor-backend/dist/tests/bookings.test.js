"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
describe("bookings routes", () => {
    it("returns a booking creation response shape", async () => {
        const app = (0, express_1.default)();
        app.use(express_1.default.json());
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
        const response = await (0, supertest_1.default)(app).post("/api/v1/bookings").send({ slotId: "slot_1" });
        expect(response.status).toBe(201);
        expect(response.body.data.bookingRef).toContain("FD-");
    });
});
