"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
describe("auth routes", () => {
    it("returns validation errors for malformed OTP request payload", async () => {
        const app = (0, express_1.default)();
        app.use(express_1.default.json());
        app.post("/api/v1/auth/send-otp", (_req, res) => {
            res.status(422).json({
                success: false,
                message: "Validation failed",
                errors: [{ field: "phone", message: "Invalid phone number" }]
            });
        });
        const response = await (0, supertest_1.default)(app).post("/api/v1/auth/send-otp").send({
            phone: "123",
            countryCode: "+91"
        });
        expect(response.status).toBe(422);
        expect(response.body.success).toBe(false);
    });
});
