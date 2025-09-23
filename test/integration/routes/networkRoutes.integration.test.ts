import request from "supertest";
import { app } from "@app";
import * as networkController from "@controllers/networkController";
import * as authService from "@services/authService";
import { UserType } from "@models/UserType";
import { InsufficientRightsError } from "@models/errors/InsufficientRightsError";
import { NotFoundError } from "@models/errors/NotFoundError";
import { ConflictError } from "@models/errors/ConflictError";
import { Network } from "@dto/Network";

jest.mock("@services/authService");
jest.mock("@controllers/networkController");

describe("Network Routes integration", () => {
  const validToken = "Bearer faketoken";
  const networkCode = "NET01";
  const mockNetwork: Network = {
    code: networkCode,
    name: "Test Network",
    description: "Test Description",
    gateways: [],
  };

  beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    (console.error as jest.Mock).mockRestore();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Helper function to mock auth success with specific user type
  const mockAuthSuccess = (userType: UserType) => {
    (authService.processToken as jest.Mock).mockResolvedValue({
      username: "testuser",
      type: userType,
    });
  };

  // GET /api/v1/networks - Get all networks
  describe("GET /api/v1/networks", () => {
    it("should return 200 with networks (any authenticated user)", async () => {
      mockAuthSuccess(UserType.Viewer);
      (networkController.getAllNetworks as jest.Mock).mockResolvedValue([
        mockNetwork,
      ]);

      const response = await request(app)
        .get("/api/v1/networks")
        .set("Authorization", validToken);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([mockNetwork]);
    });

    it("should return 401 for missing token", async () => {
      // No token provided
      const response = await request(app).get("/api/v1/networks");
      expect(response.status).toBe(401);
    });

    it("should handle 500 errors", async () => {
      mockAuthSuccess(UserType.Viewer);
      (networkController.getAllNetworks as jest.Mock).mockRejectedValue(
        new Error("Server error")
      );

      const response = await request(app)
        .get("/api/v1/networks")
        .set("Authorization", validToken);

      expect(response.status).toBe(500);
    });
  });

  // POST - Create network
  describe("POST /api/v1/networks", () => {
    it("should return 201 (admin/operator)", async () => {
      mockAuthSuccess(UserType.Admin);
      (networkController.createNetwork as jest.Mock).mockResolvedValue(
        undefined
      );

      const response = await request(app)
        .post("/api/v1/networks")
        .set("Authorization", validToken)
        .send(mockNetwork);

      expect(response.status).toBe(201);
    });

    it("should return 403 for viewer", async () => {
      // Mock authentication to throw InsufficientRightsError directly
      (authService.processToken as jest.Mock).mockRejectedValue(
        new InsufficientRightsError("Forbidden")
      );

      const response = await request(app)
        .post("/api/v1/networks")
        .set("Authorization", validToken)
        .send(mockNetwork);

      expect(response.status).toBe(403);
      expect(response.body.message).toMatch(/Forbidden/);
    });

    it("should handle 409 conflict", async () => {
      mockAuthSuccess(UserType.Operator);
      (networkController.createNetwork as jest.Mock).mockRejectedValue(
        new ConflictError("Network exists")
      );

      const response = await request(app)
        .post("/api/v1/networks")
        .set("Authorization", validToken)
        .send(mockNetwork);

      expect(response.status).toBe(409);
    });
  });

  // GET - Get a single network
  describe("GET /api/v1/networks/:networkCode", () => {
    it("should return 200 with network", async () => {
      mockAuthSuccess(UserType.Viewer);
      (networkController.getNetwork as jest.Mock).mockResolvedValue(
        mockNetwork
      );

      const response = await request(app)
        .get(`/api/v1/networks/${networkCode}`)
        .set("Authorization", validToken);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockNetwork);
    });

    it("should return 404 for missing network", async () => {
      mockAuthSuccess(UserType.Viewer);
      (networkController.getNetwork as jest.Mock).mockRejectedValue(
        new NotFoundError("Network not found")
      );

      const response = await request(app)
        .get(`/api/v1/networks/${networkCode}`)
        .set("Authorization", validToken);

      expect(response.status).toBe(404);
    });
  });

  // PATCH - Update network
  describe("PATCH /api/v1/networks/:networkCode", () => {
    it("should return 204 (admin/operator)", async () => {
      mockAuthSuccess(UserType.Operator);
      (networkController.updateNetwork as jest.Mock).mockResolvedValue(
        undefined
      );

      const response = await request(app)
        .patch(`/api/v1/networks/${networkCode}`)
        .set("Authorization", validToken)
        .send(mockNetwork);

      expect(response.status).toBe(204);
    });

    it("should return 403 for viewer", async () => {
      // Mock authentication to throw InsufficientRightsError directly
      (authService.processToken as jest.Mock).mockRejectedValue(
        new InsufficientRightsError("Forbidden")
      );

      const response = await request(app)
        .patch(`/api/v1/networks/${networkCode}`)
        .set("Authorization", validToken)
        .send(mockNetwork);

      expect(response.status).toBe(403);
      expect(response.body.message).toMatch(/Forbidden/);
    });

    it("should return 404 for missing network", async () => {
      mockAuthSuccess(UserType.Admin);
      (networkController.updateNetwork as jest.Mock).mockRejectedValue(
        new NotFoundError("Not found")
      );

      const response = await request(app)
        .patch(`/api/v1/networks/${networkCode}`)
        .set("Authorization", validToken)
        .send(mockNetwork);

      expect(response.status).toBe(404);
    });

    it("should return 409 for code conflict", async () => {
      mockAuthSuccess(UserType.Operator);
      (networkController.updateNetwork as jest.Mock).mockRejectedValue(
        new ConflictError("Code conflict")
      );

      const response = await request(app)
        .patch(`/api/v1/networks/${networkCode}`)
        .set("Authorization", validToken)
        .send(mockNetwork);

      expect(response.status).toBe(409);
    });
  });

  // DELETE - Delete network
  describe("DELETE /api/v1/networks/:networkCode", () => {
    it("should return 204 for admin/operator", async () => {
      mockAuthSuccess(UserType.Admin);
      (networkController.deleteNetwork as jest.Mock).mockResolvedValue(
        undefined
      );

      const response = await request(app)
        .delete(`/api/v1/networks/${networkCode}`)
        .set("Authorization", validToken);

      expect(response.status).toBe(204);
    });

    it("should return 403 for viewer", async () => {
      // Mock authentication to throw InsufficientRightsError directly
      (authService.processToken as jest.Mock).mockRejectedValue(
        new InsufficientRightsError("Forbidden")
      );

      const response = await request(app)
        .delete(`/api/v1/networks/${networkCode}`)
        .set("Authorization", validToken);

      expect(response.status).toBe(403);
      expect(response.body.message).toMatch(/Forbidden/);
    });

    it("should return 404 for missing network", async () => {
      mockAuthSuccess(UserType.Operator);
      (networkController.deleteNetwork as jest.Mock).mockRejectedValue(
        new NotFoundError("Not found")
      );

      const response = await request(app)
        .delete(`/api/v1/networks/${networkCode}`)
        .set("Authorization", validToken);

      expect(response.status).toBe(404);
    });
  });
});
