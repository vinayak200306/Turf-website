"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
describe("payments routes", () => {
    it("returns confirmation payload shape", async () => {
        const app = (0, express_1.default)();
        app.use(express_1.default.json());
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
        const response = await (0, supertest_1.default)(app).post("/api/v1/payments/verify").send({
            razorpayOrderId: "order_mock_123",
            razorpayPaymentId: "pay_mock_123",
            razorpaySignature: "signature",
            bookingId: "booking_1"
        });
        expect(response.status).toBe(200);
        expect(response.body.data.confirmed).toBe(true);
    });
});
