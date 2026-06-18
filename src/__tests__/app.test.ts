import { describe, expect, test } from "bun:test";
import request from "supertest";
import app from "../app";

describe("Server startup", () => {
  test("GET / responds with welcome message", async () => {
    const res = await request(app).get("/");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      message: "Welcome to the Wallet Management API!",
    });
  });
});
