import request from "supertest";
import { app } from "@app";
import { generateToken } from "@services/authService";
import { beforeAllE2e, afterAllE2e, TEST_USERS } from "@test/e2e/lifecycle";
import { GatewayDAO } from "@dao/GatewayDAO";
import { NetworkDAO } from "@dao/NetworkDAO";
import {AppDataSource} from "@database";

describe("Gateway CRUD Operations (e2e)", () => {
    let adminToken: string;
    let operatorToken: string;
    let viewerToken: string;
    const TEST_NETWORK_CODE = "test-network";
    const TEST_GATEWAY_MAC = "00:1A:2B:3C:4D:5E";
    const TEST_GATEWAY_MAC_2 = "00:1A:2B:3C:4D:" + Math.floor(Math.random() * 100 + 100).toString().padStart(2, '0');

    beforeAll(async () => {
        await beforeAllE2e();
        adminToken = generateToken(TEST_USERS.admin);
        operatorToken = generateToken(TEST_USERS.operator);
        viewerToken = generateToken(TEST_USERS.viewer);

        const networkRepo = AppDataSource.getRepository(NetworkDAO);
        await networkRepo.save({
            code: TEST_NETWORK_CODE,
            name: "Test Network",
            description: "Network for gateway testing"
        });
    });

    afterAll(async () => {
        const gatewayRepo = AppDataSource.getRepository(GatewayDAO);
        const network = await AppDataSource.getRepository(NetworkDAO).findOne({ where: { code: TEST_NETWORK_CODE } });
        if (network) {
            await gatewayRepo.delete({ network: { networkId: network.networkId } });
        }

        const networkRepo = AppDataSource.getRepository(NetworkDAO);
        await networkRepo.delete({ code: TEST_NETWORK_CODE });

        await afterAllE2e();
    });

    describe("Create gateways", () => {
        it("create a gateway (admin)", async () => {
            const res = await request(app)
                .post(`/api/v1/networks/${TEST_NETWORK_CODE}/gateways`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                    macAddress: TEST_GATEWAY_MAC,
                    name: "Test Gateway",
                    description: "Gateway for testing"
                });

            expect(res.status).toBe(201);
        });

        it("create a gateway (operator)", async () => {
            const res = await request(app)
                .post(`/api/v1/networks/${TEST_NETWORK_CODE}/gateways`)
                .set("Authorization", `Bearer ${operatorToken}`)
                .send({
                    macAddress: "00:1A:2B:3C:4D:5F",
                    name: "Test Gateway 2",
                    description: "Another gateway for testing"
                });

            expect(res.status).toBe(201);
        });

        it("error 400 Bad Request for invalid input (missing macAddress)", async () => {
            const res = await request(app)
                .post(`/api/v1/networks/${TEST_NETWORK_CODE}/gateways`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                    name: "Missing MAC",
                    description: "Should fail"
                });

            expect(res.status).toBe(400);
        });

        it("error 401 Unauthorized if token is not provided", async () => {
            const res = await request(app)
                .post(`/api/v1/networks/${TEST_NETWORK_CODE}/gateways`)
                .send({
                    macAddress: "00:1A:2B:3C:4D:61",
                    name: "No Token Gateway",
                    description: "Should fail"
                });

            expect(res.status).toBe(401);
        });

        it("error 401 Unauthorized if token is invalid", async () => {
            const res = await request(app)
                .post(`/api/v1/networks/${TEST_NETWORK_CODE}/gateways`)
                .set("Authorization", "Bearer invalid.token.here")
                .send({
                    macAddress: "00:1A:2B:3C:4D:62",
                    name: "Invalid Token Gateway",
                    description: "Should fail"
                });

            expect(res.status).toBe(401);
            expect(res.body.message).toMatch(/Unauthorized/i);
        });

        it("create (fail) a gateway without permissions (viewer)", async () => {
            const res = await request(app)
                .post(`/api/v1/networks/${TEST_NETWORK_CODE}/gateways`)
                .set("Authorization", `Bearer ${viewerToken}`)
                .send({
                    macAddress: "00:1A:2B:3C:4D:60",
                    name: "Unauthorized Gateway",
                    description: "Should not be created"
                });

            expect(res.status).toBe(403);
        });

        it("error 404 Not Found if the network does not exist", async () => {
            const res = await request(app)
                .post(`/api/v1/networks/NONEXISTENTNET/gateways`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                    macAddress: "00:1A:2B:3C:4D:63",
                    name: "Ghost Network Gateway",
                    description: "Should fail"
                });

            expect(res.status).toBe(404);
            expect(res.body.message).toMatch(/not found/i);
        });

        it("create (fail) a gateway with duplicate MAC address", async () => {
            await request(app)
                .post(`/api/v1/networks/${TEST_NETWORK_CODE}/gateways`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                    macAddress: TEST_GATEWAY_MAC_2,
                    name: "Test Gateway 2",
                    description: "Another gateway"
                });

            const res = await request(app)
                .post(`/api/v1/networks/${TEST_NETWORK_CODE}/gateways`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                    macAddress: TEST_GATEWAY_MAC_2,
                    name: "Duplicate Gateway",
                    description: "Should not be created"
                });

            expect(res.status).toBe(409);
        });

        it("error 500 Internal Server Error/unexpected failure", async () => {
            const controller = require("@controllers/gatewayController");
            const original = controller.createGateway;

            jest.spyOn(controller, "createGateway").mockImplementation(() => {
                throw new Error("Unexpected failure");
            });

            const res = await request(app)
                .post(`/api/v1/networks/${TEST_NETWORK_CODE}/gateways`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                    macAddress: "00:1A:2B:3C:4D:64",
                    name: "Internal Error Gateway",
                    description: "Should fail"
                });

            expect(res.status).toBe(500);
            expect(res.body.message).toContain("Unexpected failure");

            controller.createGateway = original;
            jest.restoreAllMocks();
        });
    });

    describe("Get all gateways", () => {
        it("should get all gateways in network (any authenticated user)", async () => {
            const res = await request(app)
                .get(`/api/v1/networks/${TEST_NETWORK_CODE}/gateways`)
                .set("Authorization", `Bearer ${viewerToken}`);

            expect(res.status).toBe(200);
            expect(res.body.length).toBeGreaterThanOrEqual(1);

            const gatewayMacs = res.body.map((g: any) => g.macAddress);
            expect(gatewayMacs).toContain(TEST_GATEWAY_MAC);
        });

        it("error 401 Unauthorized if token is not provided", async () => {
            const res = await request(app)
                .get(`/api/v1/networks/${TEST_NETWORK_CODE}/gateways`);

            expect(res.status).toBe(401);
        });

        it("should return 404 Not Found for a non-existent network", async () => {
            const res = await request(app)
                .get("/api/v1/networks/INVALIDNET/gateways")
                .set("Authorization", `Bearer ${adminToken}`);
            expect(res.status).toBe(404);
        });

        it("should return 500 Internal Server Error if an unexpected error occurs", async () => {
            jest.spyOn(require("@controllers/gatewayController"), "getAllGateways").mockImplementation(() => {
                throw new Error("Unexpected error");
            });

            const res = await request(app)
                .get("/api/v1/networks/TESTNET/gateways")
                .set("Authorization", `Bearer ${adminToken}`);

            expect(res.status).toBe(500);

            jest.restoreAllMocks();
        });
    });

    describe("Get a gateway", () => {
        it("get a specific gateway (admin)", async () => {
            const res = await request(app)
                .get(`/api/v1/networks/${TEST_NETWORK_CODE}/gateways/${TEST_GATEWAY_MAC}`)
                .set("Authorization", `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.macAddress).toBe(TEST_GATEWAY_MAC);
            expect(res.body.name).toBe("Test Gateway");
        });

        it("get a specific gateway (operator)", async () => {
            const res = await request(app)
                .get(`/api/v1/networks/${TEST_NETWORK_CODE}/gateways/${TEST_GATEWAY_MAC}`)
                .set("Authorization", `Bearer ${operatorToken}`);

            expect(res.status).toBe(200);
            expect(res.body.macAddress).toBe(TEST_GATEWAY_MAC);
            expect(res.body.name).toBe("Test Gateway");
        });

        it("get a specific gateway (viewer)", async () => {
            const res = await request(app)
                .get(`/api/v1/networks/${TEST_NETWORK_CODE}/gateways/${TEST_GATEWAY_MAC}`)
                .set("Authorization", `Bearer ${viewerToken}`);

            expect(res.status).toBe(200);
            expect(res.body.macAddress).toBe(TEST_GATEWAY_MAC);
            expect(res.body.name).toBe("Test Gateway");
        });

        it("error 401 Unauthorized if no token is provided", async () => {
            const res = await request(app)
                .get(`/api/v1/networks/${TEST_NETWORK_CODE}/gateways/${TEST_GATEWAY_MAC}`);

            expect(res.status).toBe(401);
        });

        it("error 404 for non-existent gateway", async () => {
            const res = await request(app)
                .get(`/api/v1/networks/${TEST_NETWORK_CODE}/gateways/non-existent-mac`)
                .set("Authorization", `Bearer ${viewerToken}`);

            expect(res.status).toBe(404);
        });

        it("error 500 Internal Server Error if an unexpected error occurs", async () => {
            const controller = require("@controllers/gatewayController");

            jest.spyOn(controller, "getGateway").mockImplementation(() => {
                throw new Error("Unexpected error");
            });

            const res = await request(app)
                .get(`/api/v1/networks/${TEST_NETWORK_CODE}/gateways/${TEST_GATEWAY_MAC}`)
                .set("Authorization", `Bearer ${adminToken}`);

            expect(res.status).toBe(500);
            expect(res.body.message).toContain("Unexpected error");

            jest.restoreAllMocks();
        });

    });

    describe("Update gateway", () => {
        it("update a gateway (admin)", async () => {
            const res = await request(app)
                .patch(`/api/v1/networks/${TEST_NETWORK_CODE}/gateways/${TEST_GATEWAY_MAC}`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                    macAddress: TEST_GATEWAY_MAC,
                    name: "Updated Gateway Name",
                    description: "Updated description"
                });

            expect(res.status).toBe(204);
        });

        it("update a gateway (operator)", async () => {
            const res = await request(app)
                .patch(`/api/v1/networks/${TEST_NETWORK_CODE}/gateways/${TEST_GATEWAY_MAC}`)
                .set("Authorization", `Bearer ${operatorToken}`)
                .send({
                    macAddress: TEST_GATEWAY_MAC,
                    name: "Updated by Operator",
                    description: "Updated by operator"
                });

            expect(res.status).toBe(204);
        });

        it("error 400 Bad Request for invalid input (missing macAddress)", async () => {
            const res = await request(app)
                .patch(`/api/v1/networks/${TEST_NETWORK_CODE}/gateways/${TEST_GATEWAY_MAC}`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({ macAddress: ""});

            expect(res.status).toBe(400);
        });

        it("error 401 Unauthorized if token is not provided", async () => {
            const res = await request(app)
                .patch(`/api/v1/networks/${TEST_NETWORK_CODE}/gateways/${TEST_GATEWAY_MAC}`)
                .send({
                    macAddress: "00:1A:2B:3C:4D:61",
                    name: "No Token Gateway",
                    description: "Should fail"
                });

            expect(res.status).toBe(401);
        });

        it("update (fail) a gateway without permissions (viewer)", async () => {
            const res = await request(app)
                .patch(`/api/v1/networks/${TEST_NETWORK_CODE}/gateways/${TEST_GATEWAY_MAC}`)
                .set("Authorization", `Bearer ${viewerToken}`)
                .send({
                    macAddress: TEST_GATEWAY_MAC,
                    name: "Unauthorized Update",
                    description: "Should not be updated"
                });

            expect(res.status).toBe(403);
        });

        it("error 404 Not Found for non-existent network", async () => {
            const res = await request(app)
                .patch(`/api/v1/networks/INVALIDNET/gateways/${TEST_GATEWAY_MAC}`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                    macAddress: TEST_GATEWAY_MAC,
                    name: "Updated Name"
                });

            expect(res.status).toBe(404);
        });

        it("update (fail) a duplicate MAC address", async () => {
            await request(app)
                .post(`/api/v1/networks/${TEST_NETWORK_CODE}/gateways`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                    macAddress: "00:1A:2B:3C:4D:61",
                    name: "Another Gateway",
                    description: "For duplicate test"
                });

            const res = await request(app)
                .patch(`/api/v1/networks/${TEST_NETWORK_CODE}/gateways/${TEST_GATEWAY_MAC}`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                    macAddress: "00:1A:2B:3C:4D:61",
                    name: "Duplicate MAC Attempt",
                    description: "Should fail"
                });

            expect(res.status).toBe(409);
        });

        it("error 500 Internal Server Error if an unexpected error occurs", async () => {
            jest.spyOn(require("@controllers/gatewayController"), "updateGateway").mockImplementation(() => {
                throw new Error("Unexpected error");
            });

            const res = await request(app)
                .patch(`/api/v1/networks/${TEST_NETWORK_CODE}/gateways/${TEST_GATEWAY_MAC}`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                    macAddress: TEST_GATEWAY_MAC,
                    name: "Updated Name"
                });

            expect(res.status).toBe(500);
            expect(res.body.message).toContain("Unexpected error");

            jest.restoreAllMocks();
        });
    });

    describe("Delete gateway", () => {
        it("delete gateway (admin)", async () => {
            const macToDelete = "00:1A:2B:3C:4D:62";
            await request(app)
                .post(`/api/v1/networks/${TEST_NETWORK_CODE}/gateways`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                    macAddress: macToDelete,
                    name: "Gateway to Delete",
                    description: "Will be deleted"
                });

            const res = await request(app)
                .delete(`/api/v1/networks/${TEST_NETWORK_CODE}/gateways/${macToDelete}`)
                .set("Authorization", `Bearer ${adminToken}`);

            expect(res.status).toBe(204);
        });

        it("delete gateway (operator)", async () => {
            const macToDelete = "00:1A:2B:3C:4D:63";
            await request(app)
                .post(`/api/v1/networks/${TEST_NETWORK_CODE}/gateways`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                    macAddress: macToDelete,
                    name: "Gateway to Delete by Operator",
                    description: "Will be deleted by operator"
                });

            const res = await request(app)
                .delete(`/api/v1/networks/${TEST_NETWORK_CODE}/gateways/${macToDelete}`)
                .set("Authorization", `Bearer ${operatorToken}`);

            expect(res.status).toBe(204);
        });

        it("error 401 Unauthorized if token is not provided", async () => {
            const macToDelete = "00:1A:2B:3C:4D:62";
            await request(app)
                .post(`/api/v1/networks/${TEST_NETWORK_CODE}/gateways`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                    macAddress: macToDelete,
                    name: "Gateway to Delete by Operator",
                    description: "Will be deleted by operator"
                });

            const res = await request(app)
                .delete(`/api/v1/networks/${TEST_NETWORK_CODE}/gateways/${macToDelete}`);

            expect(res.status).toBe(401);
        });

        it("fail to delete gateway without permissions (viewer)", async () => {
            const res = await request(app)
                .delete(`/api/v1/networks/${TEST_NETWORK_CODE}/gateways/${TEST_GATEWAY_MAC}`)
                .set("Authorization", `Bearer ${viewerToken}`);

            expect(res.status).toBe(403);
        });

        it("delete non-existent gateway (404)", async () => {
            const res = await request(app)
                .delete(`/api/v1/networks/${TEST_NETWORK_CODE}/gateways/non-existent-mac`)
                .set("Authorization", `Bearer ${adminToken}`);

            expect(res.status).toBe(404);
        });

        it("error 500 Internal Server Error if an unexpected error occurs", async () => {
            const macToDelete = "00:1A:2B:3C:4D:62";
            jest.spyOn(require("@controllers/gatewayController"), "deleteGateway").mockImplementation(() => {
                throw new Error("Unexpected error");
            });

            await request(app)
                .post(`/api/v1/networks/${TEST_NETWORK_CODE}/gateways`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                    macAddress: macToDelete,
                    name: "Gateway to Delete by Operator",
                    description: "Will be deleted by operator"
                });

            const res = await request(app)
                .delete(`/api/v1/networks/${TEST_NETWORK_CODE}/gateways/${TEST_GATEWAY_MAC}`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                    macAddress: TEST_GATEWAY_MAC,
                    name: "Updated Name"
                });

            expect(res.status).toBe(500);
            expect(res.body.message).toContain("Unexpected error");

            jest.restoreAllMocks();
        });
    });

});