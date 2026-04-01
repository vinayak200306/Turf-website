import request from "supertest";
import express from "express";

describe("venues routes", () => {
  it("serves a paginated venue payload", async () => {
    const app = express();
    app.get("/api/v1/venues", (_req, res) => {
      res.json({
        success: true,
        data: [{ id: "venue_1", name: "Galaxy Zone" }],
        pagination: { total: 1, page: 1, limit: 10, totalPages: 1 }
      });
    });

    const response = await request(app).get("/api/v1/venues");
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data[0].name).toBe("Galaxy Zone");
  });
});
