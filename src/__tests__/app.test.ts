import { describe, expect, test, beforeAll } from "bun:test";
import type { Express } from "express";
import request from "supertest";

let app: Express;

beforeAll(async () => {
  app = (await import("../app")).default;
});

describe("Server startup", () => {
  test("GET / responds with welcome message", async () => {
    const res = await request(app).get("/");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      message: "Welcome to the Wallet Management API!",
    });
  });
});
