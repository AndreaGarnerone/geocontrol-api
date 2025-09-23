import request from "supertest";
import { app } from "@app";
import { generateToken } from "@services/authService";
import { beforeAllE2e, afterAllE2e, TEST_USERS } from "@test/e2e/lifecycle";

describe("GET /users (e2e)", () => {
  let token: string;

  beforeAll(async () => {
    await beforeAllE2e();
    token = generateToken(TEST_USERS.admin);
  });

  afterAll(async () => {
    await afterAllE2e();
  });

  it("get all users", async () => {
    const res = await request(app)
      .get("/api/v1/users")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(3);

    const usernames = res.body.map((u: any) => u.username).sort();
    const types = res.body.map((u: any) => u.type).sort();

    expect(usernames).toEqual(["admin", "operator", "viewer"]);
    expect(types).toEqual(["admin", "operator", "viewer"]);
  });

  it("Should return 401 for unauthorized access", async () => {
    const res = await request(app)
      .get("/api/v1/users")
      .set("Authorization", `Bearer invalidtoken`);

    expect(res.status).toBe(401);
  });

  it("Should return 403 for insufficient rights", async () => {
    const operatorToken = generateToken(TEST_USERS.operator);
    const res = await request(app)
      .get("/api/v1/users")
      .set("Authorization", `Bearer ${operatorToken}`);

    expect(res.status).toBe(403);
  });
});

describe("GET /users/:id (e2e)", () => {
  let token: string;

  beforeAll(async () => {
    await beforeAllE2e();
    token = generateToken(TEST_USERS.admin);
  });

  afterAll(async () => {
    await afterAllE2e();
  });

  it("get user by username", async () => {
    const res = await request(app)
      .get("/api/v1/users/admin")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.username).toBe("admin");
    expect(res.body.type).toBe("admin");
  });

  it("should return 401 for Unauthorized user", async () => {
    const res = await request(app)
      .get("/api/v1/users/admin")
      .set("Authorization", `Bearer invalidtoken`);

    expect(res.status).toBe(401);
  });

  it("should return 403 for insufficient rights", async () => {
    const operatorToken = generateToken(TEST_USERS.operator);
    const res = await request(app)
      .get("/api/v1/users/admin")
      .set("Authorization", `Bearer ${operatorToken}`);

    expect(res.status).toBe(403);
  });

  it("should return 404 for non-existing user", async () => {
    const res = await request(app)
      .get("/api/v1/users/nonexistent")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

describe("POST /users  (e2e)", () => {
  let token: string;

  const newUser = {
    username: "newuser",
    password: "newpassword",
    type: "viewer",
  };

  beforeAll(async () => {
    await beforeAllE2e();
    token = generateToken(TEST_USERS.admin);
  });

  afterAll(async () => {
    await afterAllE2e();
  });

  it("sould create a new user", async () => {
    const res = await request(app)
      .post("/api/v1/users")
      .set("Authorization", `Bearer ${token}`)
      .send(newUser);

    expect(res.status).toBe(201);
  });

  it("should return 400 for invalid user data", async () => {
    const invalidUser = {
      username: "invaliduser",
    };

    const res = await request(app)
      .post("/api/v1/users")
      .set("Authorization", `Bearer ${token}`)
      .send(invalidUser);

    expect(res.status).toBe(400);
  });

  it("should return 401 for unauthorized access", async () => {
    const res = await request(app)
      .post("/api/v1/users")
      .set("Authorization", `Bearer invalidtoken`)
      .send(newUser);

    expect(res.status).toBe(401);
  });

  it("should return 403 for insufficient rights", async () => {
    const operatorToken = generateToken(TEST_USERS.operator);
    const res = await request(app)
      .post("/api/v1/users")
      .set("Authorization", `Bearer ${operatorToken}`)
      .send(newUser);

    expect(res.status).toBe(403);
  });

  it("should return 409 for duplicate username", async () => {
    const res = await request(app)
      .post("/api/v1/users")
      .set("Authorization", `Bearer ${token}`)
      .send(newUser);

    expect(res.status).toBe(409);
  });
});

describe("DELETW /users/:username (e2e)", () => {
  let token: string;

  beforeAll(async () => {
    await beforeAllE2e();
    token = generateToken(TEST_USERS.admin);
  });

  afterAll(async () => {
    await afterAllE2e();
  });

  it("should delete a user", async () => {
    await request(app)
      .post("/api/v1/users")
      .set("Authorization", `Bearer ${token}`)
      .send({
        username: "newuser",
        password: "newpassword",
        type: "viewer",
      });

    const res = await request(app)
      .delete("/api/v1/users/newuser")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(204);
  });

  it("should return 404 for non-existing user", async () => {
    const res = await request(app)
      .delete("/api/v1/users/nonexistent")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it("should return 401 for unauthorized access", async () => {
    const res = await request(app)
      .delete("/api/v1/users/newuser")
      .set("Authorization", `Bearer invalidtoken`);

    expect(res.status).toBe(401);
  });

  it("should return 403 for insufficient rights", async () => {
    const operatorToken = generateToken(TEST_USERS.operator);
    const res = await request(app)
      .delete("/api/v1/users/newuser")
      .set("Authorization", `Bearer ${operatorToken}`);

    expect(res.status).toBe(403);
  });

});
