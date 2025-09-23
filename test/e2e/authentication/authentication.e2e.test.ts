import request from "supertest";
import { app } from "@app";
import { beforeAllE2e, afterAllE2e, TEST_USERS } from "@test/e2e/lifecycle";

describe("POST /api/v1/auth", () => {
  beforeAll(async () => {
    await beforeAllE2e();
  });

  afterAll(async () => {
    await afterAllE2e();
  });

  it("should authenticate successfully with valid credentials", async () => {
    const response = await request(app).post("/api/v1/auth").send({
      username: TEST_USERS.admin.username,
      password: TEST_USERS.admin.password,
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("token");
  });

  it("should return 400 for invalid user data format", async () => {
    const response = await request(app).post("/api/v1/auth").send({
      username: 123, // Invalid type
      password: TEST_USERS.admin.password,
    });

    expect(response.status).toBe(400);
  });

  it("should return 400 for missing username", async () => {
    const response = await request(app).post("/api/v1/auth").send({
      password: TEST_USERS.admin.password,
    });

    expect(response.status).toBe(400);
  });

  it("should return 401 for invalid credentials", async () => {
    const response = await request(app).post("/api/v1/auth").send({
      username: TEST_USERS.admin.username,
      password: "wrongpassword",
    });

    expect(response.status).toBe(401);
  });

  it("should return 404 for non-existent user", async () => {
    const response = await request(app).post("/api/v1/auth").send({
      username: "nonexistentuser",
      password: "somepassword",
    });

    expect(response.status).toBe(404);
  });

  it("should handle malformed JSON", async () => {
    const response = await request(app)
      .post("/api/v1/auth")
      .set("Content-Type", "application/json")
      .send("invalid json");

    expect(response.status).toBe(400);
  });

  it("should handle empty request body", async () => {
    const response = await request(app).post("/api/v1/auth").send({});

    expect(response.status).toBe(400);
  });
});
