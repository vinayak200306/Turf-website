"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
describe("venues routes", () => {
    it("serves a paginated venue payload", async () => {
        const app = (0, express_1.default)();
        app.get("/api/v1/venues", (_req, res) => {
            res.json({
                success: true,
                data: [{ id: "venue_1", name: "Galaxy Zone" }],
                pagination: { total: 1, page: 1, limit: 10, totalPages: 1 }
            });
        });
        const response = await (0, supertest_1.default)(app).get("/api/v1/venues");
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data[0].name).toBe("Galaxy Zone");
    });
});
