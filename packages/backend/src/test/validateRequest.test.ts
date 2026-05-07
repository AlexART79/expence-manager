import request from "supertest";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createApp } from "../app.js";
import { validateRequest } from "../middleware/validateRequest.js";

describe("request validation middleware", () => {
  it("passes parsed body data to route handlers", async () => {
    const app = createApp({
      configureRoutes: (server) => {
        server.post(
          "/echo",
          validateRequest({
            body: z.object({ name: z.string().min(1) })
          }),
          (req, res) => {
            res.json({ name: req.body.name });
          }
        );
      }
    });

    const response = await request(app).post("/echo").send({ name: "Ada" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ name: "Ada" });
  });

  it("returns the shared validation error shape for invalid requests", async () => {
    const app = createApp({
      configureRoutes: (server) => {
        server.post(
          "/echo",
          validateRequest({
            body: z.object({ name: z.string().min(1) })
          }),
          (_req, res) => {
            res.json({ ok: true });
          }
        );
      }
    });

    const response = await request(app).post("/echo").send({ name: "" });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.message).toBe("Request validation failed");
    expect(response.body.error.details.body).toBeDefined();
  });
});
