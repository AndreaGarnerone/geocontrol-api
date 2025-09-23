import request from "supertest";
import { app } from "@app";
import * as authService from "@services/authService";
import * as sensorController from "@controllers/sensorController";
import {UserType} from "@models/UserType";
import { NotFoundError } from "@models/errors/NotFoundError";
import { ConflictError } from "@models/errors/ConflictError";
import { UnauthorizedError } from "@models/errors/UnauthorizedError"; 
import { InsufficientRightsError } from "@models/errors/InsufficientRightsError";  

jest.mock('@services/authService');
jest.mock('@controllers/sensorController', () => ({
    getAllSensors: jest.fn().mockResolvedValue([{ macAddress: 'S1', name: 'Sensor1', description: 'Test', variable: 'Temperature', unit: 'Celsius' }, { macAddress: 'S2', name: 'Sensor2', description: 'Test2', variable: 'Humidity', unit: 'Percent' }]),
    getSensor: jest.fn().mockResolvedValue({ macAddress: 'S1', name: 'Sensor1', description: 'Test', variable: 'Temperature', unit: 'Celsius' }),
    createSensor: jest.fn().mockResolvedValue(undefined),
    updateSensor: jest.fn().mockResolvedValue(undefined),
    deleteSensor: jest.fn().mockResolvedValue(undefined),
}));

const mockAuthSuccess = (userType: UserType) => {
        (authService.processToken as jest.Mock).mockResolvedValue({
            username: "testUser",
            userType: userType,
        });
    }

describe("Sensor Routes integration", () => {
    const token = "Bearer faketoken";
    afterEach(() => {
        jest.clearAllMocks();
    });

    // GET - Get all sensors
    describe("GET /api/v1/networks/:networkCode/gateways/:gatewayMac/sensors", () => {
        it("should return 200 with sensors (any authenticated user)", async () => {
            mockAuthSuccess(undefined);
            const response = await request(app)
                .get(`/api/v1/networks/N1/gateways/GW1/sensors`)
                .set('Authorization', token);

            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(2);
            expect(response.body[0].macAddress).toBe('S1');
            expect(response.body[1].macAddress).toBe('S2');
            expect(response.body[0].name).toBe('Sensor1');
            expect(response.body[1].name).toBe('Sensor2');
        });

        it("should return 200 with empty array when no sensors", async () => {
            mockAuthSuccess(undefined);
            (sensorController.getAllSensors as jest.Mock).mockResolvedValue([]);
            const response = await request(app)
                .get(`/api/v1/networks/N1/gateways/GW1/sensors`)
                .set('Authorization', token);
            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(0);
        });

        it("should return 401 for unauthorized user", async () => {
            (authService.processToken as jest.Mock).mockRejectedValue(new UnauthorizedError("Unauthorized"));
            const response = await request(app)
                .get(`/api/v1/networks/N1/gateways/GW1/sensors`)
                .set('Authorization', token);
            expect(response.status).toBe(401);
            expect(response.body.message).toBe("Unauthorized");
        });
        it("should return 404 for missing network", async () => {
            mockAuthSuccess(undefined);
            (sensorController.getAllSensors as jest.Mock).mockRejectedValue(new NotFoundError("Network not found"));
            const response = await request(app)
                .get(`/api/v1/networks/N1/gateways/GW1/sensors`)
                .set('Authorization', token);
            expect(response.status).toBe(404);
            expect(response.body.message).toBe("Network not found");
        });

        it("should return 404 for missing gateway", async () => {
            mockAuthSuccess(undefined);
            (sensorController.getAllSensors as jest.Mock).mockRejectedValue(new NotFoundError("Gateway not found"));
            const response = await request(app)
                .get(`/api/v1/networks/N1/gateways/GW2/sensors`)
                .set('Authorization', token);
            expect(response.status).toBe(404);
            expect(response.body.message).toBe("Gateway not found");
        });

        it("should handle 500 errors", async () => {
            mockAuthSuccess(undefined);
            (sensorController.getAllSensors as jest.Mock).mockRejectedValue(new Error("Generic error"));
            const response = await request(app)
                .get(`/api/v1/networks/N1/gateways/GW1/sensors`)
                .set('Authorization', token);
            expect(response.status).toBe(500);
            expect(response.body.message).toBe("Generic error");
        });
    });

    // POST - Create sensor
    describe("POST /api/v1/networks/:networkCode/gateways/:gatewayMac/sensors", () => {
        it("should return 201 (admin/operator)", async () => {
            mockAuthSuccess(undefined);
            const newSensor = { macAddress: 'S3', name: 'Sensor3', description: 'Test3', variable: 'Pressure', unit: 'Pascal' };
            const response = await request(app)
                .post(`/api/v1/networks/N1/gateways/GW1/sensors`)
                .set('Authorization', token)
                .send(newSensor);

            expect(response.status).toBe(201);
        });

        it("should return 400 for missing macAddress", async () => {
            const newSensor = { name: 'Sensor3', description: 'Test3', variable: 'Pressure', unit: 'Pascal' };
            const response = await request(app)
                .post(`/api/v1/networks/N1/gateways/GW1/sensors`)
                .set('Authorization', token)
                .send(newSensor);
            expect(response.status).toBe(400);
            expect(response.body.message).toBe("request/body must have required property 'macAddress'");
        });

        it("should return 401 for unauthorized user", async () => {
            (authService.processToken as jest.Mock).mockRejectedValue(new UnauthorizedError("Unauthorized"));
            const newSensor = { macAddress: 'S3', name: 'Sensor3', description: 'Test3', variable: 'Pressure', unit: 'Pascal' };
            const response = await request(app)
                .post(`/api/v1/networks/N1/gateways/GW1/sensors`)
                .set('Authorization', token)
                .send(newSensor);
            expect(response.status).toBe(401);
            expect(response.body.message).toBe("Unauthorized");
        });

        it("should return 403 for viewer", async () => {
            (authService.processToken as jest.Mock).mockResolvedValue({ userType: UserType.Viewer });
            const newSensor = { macAddress: 'S3', name: 'Sensor3', description: 'Test3', variable: 'Pressure', unit: 'Pascal' };
            (sensorController.createSensor as jest.Mock).mockRejectedValue(new InsufficientRightsError("Insufficient rights"));
            const response = await request(app)
                .post(`/api/v1/networks/N1/gateways/GW1/sensors`)
                .set('Authorization', token)
                .send(newSensor);
            expect(response.status).toBe(403);
            expect(response.body.message).toBe("Insufficient rights");
        });

        it("should return 404 for missing network", async () => {
            (sensorController.createSensor as jest.Mock).mockRejectedValue(new NotFoundError("Network not found"));
            const newSensor = { macAddress: 'S3', name: 'Sensor3', description: 'Test3', variable: 'Pressure', unit: 'Pascal' };
            const response = await request(app)
                .post(`/api/v1/networks/N1/gateways/GW1/sensors`)
                .set('Authorization', token)
                .send(newSensor);
            expect(response.status).toBe(404);
            expect(response.body.message).toBe("Network not found");
        });

        it("should return 404 for missing gateway", async () => {
            (sensorController.createSensor as jest.Mock).mockRejectedValue(new NotFoundError("Gateway not found"));
            const newSensor = { macAddress: 'S3', name: 'Sensor3', description: 'Test3', variable: 'Pressure', unit: 'Pascal' };
            const response = await request(app)
                .post(`/api/v1/networks/N1/gateways/GW2/sensors`)
                .set('Authorization', token)
                .send(newSensor);
            expect(response.status).toBe(404);
            expect(response.body.message).toBe("Gateway not found");
        });

        it("should handle 409 conflict", async () => {
            mockAuthSuccess(undefined);
            (sensorController.createSensor as jest.Mock).mockRejectedValue(new ConflictError("Sensor already exists"));
            const newSensor = { macAddress: 'S1', name: 'Sensor1', description: 'Test', variable: 'Temperature', unit: 'Celsius' };
            const response = await request(app)
                .post(`/api/v1/networks/N1/gateways/GW1/sensors`)
                .set('Authorization', token)
                .send(newSensor);

            expect(response.status).toBe(409);
            expect(response.body.message).toBe("Sensor already exists");
        });

        it("should handle 500 errors", async () => {
            mockAuthSuccess(undefined);
            (sensorController.createSensor as jest.Mock).mockRejectedValue(new Error("Generic error"));
            const newSensor = { macAddress: 'S3', name: 'Sensor3', description: 'Test3', variable: 'Pressure', unit: 'Pascal' };
            const response = await request(app)
                .post(`/api/v1/networks/N1/gateways/GW1/sensors`)
                .set('Authorization', token)
                .send(newSensor);
            expect(response.status).toBe(500);
            expect(response.body.message).toBe("Generic error");
        });
    });

    // GET - Get a single sensor
    describe("GET /api/v1/networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac", () => {
        it("should return 200 with sensor", async () => {
            mockAuthSuccess(undefined);
            const response = await request(app)
                .get(`/api/v1/networks/N1/gateways/GW1/sensors/S1`)
                .set('Authorization', token);

            expect(response.status).toBe(200);
            expect(response.body.macAddress).toBe('S1');
        });

        it("should return 401 for unauthorized user", async () => {
            (authService.processToken as jest.Mock).mockRejectedValue(new UnauthorizedError("Unauthorized"));
            const response = await request(app)
                .get(`/api/v1/networks/N1/gateways/GW1/sensors/S1`)
                .set('Authorization', token);
            expect(response.status).toBe(401);
            expect(response.body.message).toBe("Unauthorized");
        });

        it("should return 404 for missing sensor", async () => {
            mockAuthSuccess(undefined);
            (sensorController.getSensor as jest.Mock).mockRejectedValue(new NotFoundError("Sensor not found"));
            const response = await request(app)
                .get(`/api/v1/networks/N1/gateways/GW1/sensors/S3`)
                .set('Authorization', token);
            expect(response.status).toBe(404);
            expect(response.body.message).toBe("Sensor not found");
        });

        it("should return 404 for missing network", async () => {
            mockAuthSuccess(undefined);
            (sensorController.getSensor as jest.Mock).mockRejectedValue(new NotFoundError("Network not found"));
            const response = await request(app)
                .get(`/api/v1/networks/N1/gateways/GW1/sensors/S1`)
                .set('Authorization', token);
            expect(response.status).toBe(404);
            expect(response.body.message).toBe("Network not found");
        });

        it("should return 404 for missing gateway", async () => {
            mockAuthSuccess(undefined);
            (sensorController.getSensor as jest.Mock).mockRejectedValue(new NotFoundError("Gateway not found"));
            const response = await request(app)
                .get(`/api/v1/networks/N1/gateways/GW2/sensors/S1`)
                .set('Authorization', token);
            expect(response.status).toBe(404);
            expect(response.body.message).toBe("Gateway not found");
        });

        it("should handle 500 errors", async () => {
            mockAuthSuccess(undefined);
            (sensorController.getSensor as jest.Mock).mockRejectedValue(new Error("Generic error"));
            const response = await request(app)
                .get(`/api/v1/networks/N1/gateways/GW1/sensors/S1`)
                .set('Authorization', token);
            expect(response.status).toBe(500);
            expect(response.body.message).toBe("Generic error");
        });

    });

    // PATCH - Update sensor
    describe("PATCH /api/v1/networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac", () => {
        it("should return 204 without macAddress", async () => {
            const updatedSensor = { name: 'Updated Sensor1', description: 'Updated Test', variable: 'Temperature', unit: 'Celsius' };
            const response = await request(app)
                .patch(`/api/v1/networks/N1/gateways/GW1/sensors/S1`)
                .set('Authorization', token)
                .send(updatedSensor);

            expect(response.status).toBe(204);
        });

        it("should return 204 (admin/operator)", async () => {
            const updatedSensor = {macAddress: 'S1', name: 'Updated Sensor1', description: 'Updated Test', variable: 'Temperature', unit: 'Celsius' };
            const response = await request(app)
                .patch(`/api/v1/networks/N1/gateways/GW1/sensors/S1`)
                .set('Authorization', token)
                .send(updatedSensor);

            expect(response.status).toBe(204);
        });

        it("should return 400 for empty macAddress", async () => {
            const updatedSensor = { macAddress: '', name: 'Updated Sensor1', description: 'Updated Test', variable: 'Temperature', unit: 'Celsius' };
            const response = await request(app)
                .patch(`/api/v1/networks/N1/gateways/GW1/sensors/S1`)
                .set('Authorization', token)
                .send(updatedSensor);
            expect(response.status).toBe(400);
            expect(response.body.message).toBe("request/body/macAddress must NOT have fewer than 1 characters");
        });

        it("should return 401 for unauthorized user", async () => {
            (authService.processToken as jest.Mock).mockRejectedValue(new UnauthorizedError("Unauthorized"));
            const updatedSensor = { macAddress: 'S1', name: 'Updated Sensor1', description: 'Updated Test', variable: 'Temperature', unit: 'Celsius' };
            const response = await request(app)
                .patch(`/api/v1/networks/N1/gateways/GW1/sensors/S1`)
                .set('Authorization', token)
                .send(updatedSensor);
            expect(response.status).toBe(401);
            expect(response.body.message).toBe("Unauthorized");
        });

        it("should return 403 for viewer", async () => {
            (authService.processToken as jest.Mock).mockResolvedValue({ userType: UserType.Viewer });
            const updatedSensor = { macAddress: 'S1', name: 'Updated Sensor1', description: 'Updated Test', variable: 'Temperature', unit: 'Celsius' };
            (sensorController.updateSensor as jest.Mock).mockRejectedValue(new InsufficientRightsError("Insufficient rights"));
            const response = await request(app)
                .patch(`/api/v1/networks/N1/gateways/GW1/sensors/S1`)
                .set('Authorization', token)
                .send(updatedSensor);
            expect(response.status).toBe(403);
            expect(response.body.message).toBe("Insufficient rights");
        });

        it("should return 404 for missing sensor", async () => {
            (sensorController.updateSensor as jest.Mock).mockRejectedValue(new NotFoundError("Sensor not found"));
            const updatedSensor = { macAddress: 'S3', name: 'Updated Sensor3', description: 'Updated Test3', variable: 'Pressure', unit: 'Pascal' };
            const response = await request(app)
                .patch(`/api/v1/networks/N1/gateways/GW1/sensors/S3`)
                .set('Authorization', token)
                .send(updatedSensor);
            expect(response.status).toBe(404);
            expect(response.body.message).toBe("Sensor not found");
        });

        it("should return 404 for missing network", async () => {
            (sensorController.updateSensor as jest.Mock).mockRejectedValue(new NotFoundError("Network not found"));
            const updatedSensor = { macAddress: 'S1', name: 'Updated Sensor1', description: 'Updated Test', variable: 'Temperature', unit: 'Celsius' };
            const response = await request(app)
                .patch(`/api/v1/networks/N1/gateways/GW1/sensors/S1`)
                .set('Authorization', token)
                .send(updatedSensor);
            expect(response.status).toBe(404);
            expect(response.body.message).toBe("Network not found");
        });

        it("should return 404 for missing gateway", async () => {
            (sensorController.updateSensor as jest.Mock).mockRejectedValue(new NotFoundError("Gateway not found"));
            const updatedSensor = { macAddress: 'S1', name: 'Updated Sensor1', description: 'Updated Test', variable: 'Temperature', unit: 'Celsius' };
            const response = await request(app)
                .patch(`/api/v1/networks/N1/gateways/GW2/sensors/S1`)
                .set('Authorization', token)
                .send(updatedSensor);
            expect(response.status).toBe(404);
            expect(response.body.message).toBe("Gateway not found");
        });

        it("should handle 500 error", async () => {
            mockAuthSuccess(undefined);
            (sensorController.updateSensor as jest.Mock).mockRejectedValue(new Error("Generic error"));
            const updatedSensor = { macAddress: 'S1', name: 'Updated Sensor1', description: 'Updated Test', variable: 'Temperature', unit: 'Celsius' };
            const response = await request(app)
                .patch(`/api/v1/networks/N1/gateways/GW1/sensors/S1`)
                .set('Authorization', token)
                .send(updatedSensor);
            expect(response.status).toBe(500);
            expect(response.body.message).toBe("Generic error");
        });
    });

    // DELETE - Delete sensor
    describe("DELETE /api/v1/networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac", () => {
        it("should return 204 for admin/operator", async () => {
            const response = await request(app)
                .delete(`/api/v1/networks/N1/gateways/GW1/sensors/S1`)
                .set('Authorization', token);
            expect(response.status).toBe(204);
        });

        it("should return 401 for unauthorized user", async () => {
            (authService.processToken as jest.Mock).mockRejectedValue(new UnauthorizedError("Unauthorized"));
            const response = await request(app)
                .delete(`/api/v1/networks/N1/gateways/GW1/sensors/S1`)
                .set('Authorization', token);
            expect(response.status).toBe(401);
            expect(response.body.message).toBe("Unauthorized");
        });

        it("should return 403 for viewer", async () => {
            (authService.processToken as jest.Mock).mockResolvedValue({ userType: UserType.Viewer });
            (sensorController.deleteSensor as jest.Mock).mockRejectedValue(new InsufficientRightsError("Insufficient rights"));
            const response = await request(app)
                .delete(`/api/v1/networks/N1/gateways/GW1/sensors/S1`)
                .set('Authorization', token);
            expect(response.status).toBe(403);
            expect(response.body.message).toBe("Insufficient rights");
        });

        it("should return 404 for missing sensor", async () => {
            (sensorController.deleteSensor as jest.Mock).mockRejectedValue(new NotFoundError("Sensor not found"));
            const response = await request(app)
                .delete(`/api/v1/networks/N1/gateways/GW1/sensors/S3`)
                .set('Authorization', token);
            expect(response.status).toBe(404);
            expect(response.body.message).toBe("Sensor not found");
        });

        it("should return 404 for missing network", async () => {
            (sensorController.deleteSensor as jest.Mock).mockRejectedValue(new NotFoundError("Network not found"));
            const response = await request(app)
                .delete(`/api/v1/networks/N1/gateways/GW1/sensors/S1`)
                .set('Authorization', token);
            expect(response.status).toBe(404);
            expect(response.body.message).toBe("Network not found");
        });

        it("should return 404 for missing gateway", async () => {
            (sensorController.deleteSensor as jest.Mock).mockRejectedValue(new NotFoundError("Gateway not found"));
            const response = await request(app)
                .delete(`/api/v1/networks/N1/gateways/GW2/sensors/S1`)
                .set('Authorization', token);
            expect(response.status).toBe(404);
            expect(response.body.message).toBe("Gateway not found");
        });

        it("should handle 500 error", async () => {
            mockAuthSuccess(undefined);
            (sensorController.deleteSensor as jest.Mock).mockRejectedValue(new Error("Generic error"));
            const response = await request(app)
                .delete(`/api/v1/networks/N1/gateways/GW1/sensors/S1`)
                .set('Authorization', token);
            expect(response.status).toBe(500);
            expect(response.body.message).toBe("Generic error");
        });
    });
});