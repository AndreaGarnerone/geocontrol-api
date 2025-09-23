import request from "supertest";
import { app } from "@app";
import * as authService from "@services/authService";
import * as gatewayController from "@controllers/gatewayController";
import { Gateway as GatewayDTO } from "@dto/Gateway";
import { UserType } from "@models/UserType";
import { UnauthorizedError } from "@models/errors/UnauthorizedError";
import { InsufficientRightsError } from "@models/errors/InsufficientRightsError";
import { NotFoundError } from "@models/errors/NotFoundError";
import { ConflictError } from "@models/errors/ConflictError";

jest.mock("@services/authService");
jest.mock("@controllers/gatewayController");

describe("GatewayRoutes integration", () => {
    const token = "Bearer faketoken";
    const networkCode = "NET01";
    const gatewayMac = "00:11:22:33:44:55";
    const fakeGateway: GatewayDTO = {
        macAddress: gatewayMac,
        name: "Test Gateway",
        description: "Test Description"
    };

    const mockAuthSuccess = (userType?: UserType) => {
        (authService.processToken as jest.Mock).mockResolvedValue({
            username: "testUser",
            userType: userType,
        });
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

    // GET - Get all gateways
    describe("GET /api/v1/networks/${networkCode}/gateways", () => {
        it("should return 200 with gateways (any authenticated user)", async () => {
            mockAuthSuccess();
            (gatewayController.getAllGateways as jest.Mock).mockResolvedValue([fakeGateway]);

            const response = await request(app)
                .get(`/api/v1/networks/${networkCode}/gateways`)
                .set("Authorization", token);

            expect(response.status).toBe(200);
            expect(response.body).toEqual([fakeGateway]);
            expect(gatewayController.getAllGateways).toHaveBeenCalledWith(networkCode);
        });

        it("should return 200 with empty array when no gateways", async () => {
            mockAuthSuccess();
            (gatewayController.getAllGateways as jest.Mock).mockResolvedValue([]);

            const response = await request(app)
                .get(`/api/v1/networks/${networkCode}/gateways`)
                .set("Authorization", token);

            expect(response.status).toBe(200);
            expect(response.body).toEqual([]);
            expect(response.body).toHaveLength(0);
        });

        it("should return 401 for unauthorized user", async () => {
            (authService.processToken as jest.Mock).mockRejectedValue(new UnauthorizedError("Unauthorized"));

            const response = await request(app)
                .get(`/api/v1/networks/${networkCode}/gateways`)
                .set("Authorization", token);

            expect(response.status).toBe(401);
            expect(response.body.message).toBe("Unauthorized");
        });

        it("should return 404 for missing network", async () => {
            mockAuthSuccess();
            (gatewayController.getAllGateways as jest.Mock).mockRejectedValue(
                new NotFoundError("Network not found")
            );

            const response = await request(app)
                .get(`/api/v1/networks/INVALID_NET/gateways`)
                .set("Authorization", token);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe("Network not found");
        });

        it("should handle 500 errors", async () => {
            mockAuthSuccess();
            (gatewayController.getAllGateways as jest.Mock).mockRejectedValue(new Error("DB error"));

            const response = await request(app)
                .get(`/api/v1/networks/${networkCode}/gateways`)
                .set("Authorization", token);

            expect(response.status).toBe(500);
            expect(response.body.message).toBe("DB error");
        });
    });

    // POST - Create gateway
    describe("POST /api/v1/networks/${networkCode}/gateways", () => {
        const newGateway = {
            macAddress: "AA:BB:CC",
            name: "New Gateway",
            description: "New Description"
        };

        it("should return 201 (admin/operator)", async () => {
            mockAuthSuccess(UserType.Admin);
            (gatewayController.createGateway as jest.Mock).mockResolvedValue(newGateway);

            const response = await request(app)
                .post(`/api/v1/networks/${networkCode}/gateways`)
                .set("Authorization", token)
                .send(newGateway)
                .timeout(5000);

            expect(response.status).toBe(201);
            expect(gatewayController.createGateway).toHaveBeenCalledWith(
                networkCode,
                expect.objectContaining(newGateway)
            );
        });

        it("should return 400 for missing macAddress", async () => {
            mockAuthSuccess(UserType.Admin);
            const invalidGateway = {
                name: "New Gateway",
                description: "New Description"
            };

            const response = await request(app)
                .post(`/api/v1/networks/${networkCode}/gateways`)
                .set("Authorization", token)
                .send(invalidGateway);

            expect(response.status).toBe(400);
            expect(response.body.message).toContain("macAddress");
        });

        it("should return 400 for invalid macAddress", async () => {
            mockAuthSuccess(UserType.Admin);
            const invalidGateway = {
                macAddress: "",
                name: "New Gateway",
                description: "New Description"
            };

            const response = await request(app)
                .post(`/api/v1/networks/${networkCode}/gateways`)
                .set("Authorization", token)
                .send(invalidGateway);

            expect(response.status).toBe(400);
        });

        it("should return 401 for unauthorized user", async () => {
            (authService.processToken as jest.Mock).mockRejectedValue(new UnauthorizedError("Unauthorized"));

            const response = await request(app)
                .post(`/api/v1/networks/${networkCode}/gateways`)
                .set("Authorization", token)
                .send(newGateway);

            expect(response.status).toBe(401);
            expect(response.body.message).toBe("Unauthorized");
        });

        it("should return 403 for viewer", async () => {
            (authService.processToken as jest.Mock).mockResolvedValue({ userType: UserType.Viewer });
            (gatewayController.createGateway as jest.Mock).mockRejectedValue(
                new InsufficientRightsError("Insufficient rights")
            );

            const response = await request(app)
                .post(`/api/v1/networks/${networkCode}/gateways`)
                .set("Authorization", token)
                .send(newGateway);

            expect(response.status).toBe(403);
            expect(response.body.message).toBe("Insufficient rights");
        });

        it("should return 404 for missing network", async () => {
            mockAuthSuccess(UserType.Admin);
            (gatewayController.createGateway as jest.Mock).mockRejectedValue(
                new NotFoundError("Network not found")
            );

            const response = await request(app)
                .post(`/api/v1/networks/INVALID_NET/gateways`)
                .set("Authorization", token)
                .send(newGateway);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe("Network not found");
        });

        it("should return 409 for duplicate gateway", async () => {
            mockAuthSuccess(UserType.Admin);
            (gatewayController.createGateway as jest.Mock).mockRejectedValue(
                new ConflictError("Gateway already exists")
            );

            const response = await request(app)
                .post(`/api/v1/networks/${networkCode}/gateways`)
                .set("Authorization", token)
                .send(fakeGateway);

            expect(response.status).toBe(409);
            expect(response.body.message).toBe("Gateway already exists");
        });

        it("should return 500 for internal error", async () => {
            mockAuthSuccess(UserType.Admin);
            (gatewayController.createGateway as jest.Mock).mockRejectedValue(new Error("Internal Error"));

            const response = await request(app)
                .post(`/api/v1/networks/${networkCode}/gateways`)
                .set("Authorization", token)
                .send(newGateway);

            expect(response.status).toBe(500);
            expect(response.body.message).toBe("Internal Error");
        });
    });

    // GET - Get a single gateway
    describe("GET /api/v1/networks/${networkCode}/gateways/${gatewayMac}", () => {
        it("should return 200 with gateway", async () => {
            mockAuthSuccess();
            (gatewayController.getGateway as jest.Mock).mockResolvedValue(fakeGateway);

            const response = await request(app)
                .get(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}`)
                .set("Authorization", token);

            expect(response.status).toBe(200);
            expect(response.body).toEqual(fakeGateway);
            expect(gatewayController.getGateway).toHaveBeenCalledWith(networkCode, gatewayMac);
        });

        it("should return 401 for unauthorized user", async () => {
            (authService.processToken as jest.Mock).mockRejectedValue(new UnauthorizedError("Unauthorized"));

            const response = await request(app)
                .get(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}`)
                .set("Authorization", token);

            expect(response.status).toBe(401);
            expect(response.body.message).toBe("Unauthorized");
        });

        it("should return 404 for missing gateway", async () => {
            mockAuthSuccess();
            (gatewayController.getGateway as jest.Mock).mockRejectedValue(
                new NotFoundError("Gateway not found")
            );

            const response = await request(app)
                .get(`/api/v1/networks/${networkCode}/gateways/unknown`)
                .set("Authorization", token);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe("Gateway not found");
        });

        it("should return 404 for missing network", async () => {
            mockAuthSuccess();
            (gatewayController.getGateway as jest.Mock).mockRejectedValue(
                new NotFoundError("Network not found")
            );

            const response = await request(app)
                .get(`/api/v1/networks/INVALID_NET/gateways/${gatewayMac}`)
                .set("Authorization", token);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe("Network not found");
        });

        it("should handle 500 errors", async () => {
            mockAuthSuccess();
            (gatewayController.getGateway as jest.Mock).mockRejectedValue(new Error("Generic error"));

            const response = await request(app)
                .get(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}`)
                .set("Authorization", token);

            expect(response.status).toBe(500);
            expect(response.body.message).toBe("Generic error");
        });
    });

    // PATCH - Update gateway
    describe("PATCH /api/v1/networks/${networkCode}/gateways/${gatewayMac}", () => {
        const updatedGateway = {
            macAddress: gatewayMac,
            name: "Updated Gateway",
            description: "Updated Description"
        };

        it("should return 204 for successful update", async () => {
            mockAuthSuccess(UserType.Admin);
            (gatewayController.updateGateway as jest.Mock).mockResolvedValue(undefined);

            const response = await request(app)
                .patch(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}`)
                .set("Authorization", token)
                .send(updatedGateway);

            expect(response.status).toBe(204);
            expect(gatewayController.updateGateway).toHaveBeenCalledWith(
                networkCode,
                gatewayMac,
                expect.objectContaining(updatedGateway)
            );
        });

        it("should return 204 without macAddress", async () => {
            mockAuthSuccess(UserType.Admin);
            (gatewayController.updateGateway as jest.Mock).mockResolvedValue(undefined);
            const partialUpdate = {
                name: "Updated Gateway",
                description: "Updated Description"
            };

            const response = await request(app)
                .patch(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}`)
                .set("Authorization", token)
                .send(partialUpdate);

            expect(response.status).toBe(204);
        });

        it("should return 400 for empty macAddress", async () => {
            mockAuthSuccess(UserType.Admin);
            const invalidUpdate = {
                macAddress: "",
                name: "Updated Gateway",
                description: "Updated Description"
            };

            const response = await request(app)
                .patch(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}`)
                .set("Authorization", token)
                .send(invalidUpdate);

            expect(response.status).toBe(400);
        });

        it("should return 401 for unauthorized user", async () => {
            (authService.processToken as jest.Mock).mockRejectedValue(new UnauthorizedError("Unauthorized"));

            const response = await request(app)
                .patch(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}`)
                .set("Authorization", token)
                .send(updatedGateway);

            expect(response.status).toBe(401);
            expect(response.body.message).toBe("Unauthorized");
        });

        it("should return 403 for viewer", async () => {
            (authService.processToken as jest.Mock).mockResolvedValue({ userType: UserType.Viewer });
            (gatewayController.updateGateway as jest.Mock).mockRejectedValue(
                new InsufficientRightsError("Insufficient rights")
            );

            const response = await request(app)
                .patch(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}`)
                .set("Authorization", token)
                .send(updatedGateway);

            expect(response.status).toBe(403);
            expect(response.body.message).toBe("Insufficient rights");
        });

        it("should return 404 for missing gateway", async () => {
            mockAuthSuccess(UserType.Admin);
            (gatewayController.updateGateway as jest.Mock).mockRejectedValue(
                new NotFoundError("Gateway not found")
            );

            const response = await request(app)
                .patch(`/api/v1/networks/${networkCode}/gateways/unknown`)
                .set("Authorization", token)
                .send(updatedGateway);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe("Gateway not found");
        });

        it("should return 404 for missing network", async () => {
            mockAuthSuccess(UserType.Admin);
            (gatewayController.updateGateway as jest.Mock).mockRejectedValue(
                new NotFoundError("Network not found")
            );

            const response = await request(app)
                .patch(`/api/v1/networks/INVALID_NET/gateways/${gatewayMac}`)
                .set("Authorization", token)
                .send(updatedGateway);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe("Network not found");
        });

        it("should return 409 for conflicting macAddress", async () => {
            mockAuthSuccess(UserType.Admin);
            (gatewayController.updateGateway as jest.Mock).mockRejectedValue(
                new ConflictError("Gateway with this MAC address already exists")
            );

            const response = await request(app)
                .patch(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}`)
                .set("Authorization", token)
                .send({ ...updatedGateway, macAddress: "11:22:33" });

            expect(response.status).toBe(409);
            expect(response.body.message).toBe("Gateway with this MAC address already exists");
        });

        it("should return 500 for internal error", async () => {
            mockAuthSuccess(UserType.Admin);
            (gatewayController.updateGateway as jest.Mock).mockRejectedValue(new Error("Internal Error"));

            const response = await request(app)
                .patch(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}`)
                .set("Authorization", token)
                .send(updatedGateway);

            expect(response.status).toBe(500);
            expect(response.body.message).toBe("Internal Error");
        });
    });

    // DELETE - Delete gateway
    describe("DELETE /api/v1/networks/${networkCode}/gateways/${gatewayMac}", () => {
        it("should return 204 for admin/operator", async () => {
            mockAuthSuccess(UserType.Admin);
            (gatewayController.deleteGateway as jest.Mock).mockResolvedValue(undefined);

            const response = await request(app)
                .delete(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}`)
                .set("Authorization", token);

            expect(response.status).toBe(204);
            expect(gatewayController.deleteGateway).toHaveBeenCalledWith(networkCode, gatewayMac);
        });

        it("should return 401 for unauthorized user", async () => {
            (authService.processToken as jest.Mock).mockRejectedValue(new UnauthorizedError("Unauthorized"));

            const response = await request(app)
                .delete(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}`)
                .set("Authorization", token);

            expect(response.status).toBe(401);
            expect(response.body.message).toBe("Unauthorized");
        });

        it("should return 403 for viewer", async () => {
            (authService.processToken as jest.Mock).mockResolvedValue({ userType: UserType.Viewer });
            (gatewayController.deleteGateway as jest.Mock).mockRejectedValue(
                new InsufficientRightsError("Insufficient rights")
            );

            const response = await request(app)
                .delete(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}`)
                .set("Authorization", token);

            expect(response.status).toBe(403);
            expect(response.body.message).toBe("Insufficient rights");
        });

        it("should return 404 for missing gateway", async () => {
            mockAuthSuccess(UserType.Admin);
            (gatewayController.deleteGateway as jest.Mock).mockRejectedValue(
                new NotFoundError("Gateway not found")
            );

            const response = await request(app)
                .delete(`/api/v1/networks/${networkCode}/gateways/unknown`)
                .set("Authorization", token);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe("Gateway not found");
        });

        it("should return 404 for missing network", async () => {
            mockAuthSuccess(UserType.Admin);
            (gatewayController.deleteGateway as jest.Mock).mockRejectedValue(
                new NotFoundError("Network not found")
            );

            const response = await request(app)
                .delete(`/api/v1/networks/INVALID_NET/gateways/${gatewayMac}`)
                .set("Authorization", token);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe("Network not found");
        });

        it("should return 500 for internal error", async () => {
            mockAuthSuccess(UserType.Admin);
            (gatewayController.deleteGateway as jest.Mock).mockRejectedValue(new Error("Internal Error"));

            const response = await request(app)
                .delete(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}`)
                .set("Authorization", token);

            expect(response.status).toBe(500);
            expect(response.body.message).toBe("Internal Error");
        });
    });
});