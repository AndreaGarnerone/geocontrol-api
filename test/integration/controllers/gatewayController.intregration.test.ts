import * as gatewayController from "@controllers/gatewayController";
import { GatewayDAO } from "@dao/GatewayDAO";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { mapGatewayDAOToDTO } from "@services/mapperService";
import AppError from "@errors/AppError";
import {SensorRepository} from "@repositories/SensorRepository";
import {NotFoundError} from "@errors/NotFoundError";
import {ConflictError} from "@errors/ConflictError";

jest.mock("@services/mapperService");
jest.mock("@repositories/GatewayRepository");
jest.mock("@repositories/SensorRepository");

const fakeGatewayDAO: GatewayDAO = {
    gatewayId: 0,
    macAddress: "00:11:22",
    name: "Test Gateway",
    description: "A tester gateway",
    sensors: [],
    network: {
        code: "NET01",
        name: "Test Network",
        description: "A tester network",
        gateways: [],
        networkId: 0
    }
};

const expectedDTO = {
    macAddress: "00:11:22",
    networkCode: "NET01",
    name: "Test Gateway",
    description: "Mapped description"
};

describe("GatewayController Integration test", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });


    // Get all gateways
    describe("getAllGateways", () => {
        it("should return all gateways", async () => {
            (GatewayRepository as jest.Mock).mockImplementation(() => ({
                getGatewayByAddress: jest.fn().mockResolvedValue(fakeGatewayDAO)
            }));

            (SensorRepository as jest.Mock).mockImplementation(() => ({
                getAllSensors: jest.fn().mockResolvedValue([])
            }));

            (mapGatewayDAOToDTO as jest.Mock).mockReturnValue(expectedDTO);

            const result = await gatewayController.getGateway("NET01", "00:11:22");
            expect(result).toEqual(expectedDTO);
            expect(mapGatewayDAOToDTO).toHaveBeenCalledWith(fakeGatewayDAO);
        });

        it("should handle repository errors", async () => {
            (GatewayRepository as jest.Mock).mockImplementation(() => ({
                getAllGateways: jest.fn().mockRejectedValue(new Error("DB failure"))
            }));

            await expect(gatewayController.getAllGateways("NET01")).rejects.toThrow(AppError);
            await expect(gatewayController.getAllGateways("NET01")).rejects.toMatchObject({ status: 500 });
        });

    });

    // Create gateway
    describe("createGateway", () => {
        it("should create a gateway", async () => {
            const gatewayDTO = {
                macAddress: "00:11:22",
                name: "Test Gateway",
                description: "A tester gateway"
            };

            (GatewayRepository as jest.Mock).mockImplementation(() => ({
                createGateways: jest.fn().mockResolvedValue(fakeGatewayDAO)
            }));

            (mapGatewayDAOToDTO as jest.Mock).mockReturnValue(expectedDTO);

            const result = await gatewayController.createGateway("NET01", gatewayDTO);
            expect(result).toEqual(expectedDTO);
            expect(mapGatewayDAOToDTO).toHaveBeenCalledWith(fakeGatewayDAO);
        });

        it("should handle repository errors", async () => {
            const gatewayDTO = {
                macAddress: "00:11:22",
                name: "Test Gateway",
                description: "A tester gateway"
            };

            (GatewayRepository as jest.Mock).mockImplementation(() => ({
                createGateways: jest.fn().mockRejectedValue(new Error("DB failure"))
            }));

            await expect(gatewayController.createGateway("NET01", gatewayDTO)).rejects.toThrow(AppError);
            await expect(gatewayController.createGateway("NET01", gatewayDTO)).rejects.toMatchObject({ status: 500 });
        });

        it("should throw ConflictError when gateway already exists", async () => {
            const gatewayDTO = {
                macAddress: "00:11:22",
                name: "Test Gateway",
                description: "A tester gateway"
            };

            (GatewayRepository as jest.Mock).mockImplementation(() => ({
                createGateways: jest.fn().mockRejectedValue(new ConflictError("Gateway already exists"))
            }));

            await expect(gatewayController.createGateway("NET01", gatewayDTO)).rejects.toThrow(ConflictError);
        });

    });

    // Get a gateway
    describe("getGateway", () => {
        it("should return a single gateway", async () => {
            (GatewayRepository as jest.Mock).mockImplementation(() => ({
                getGatewayByAddress: jest.fn().mockResolvedValue(fakeGatewayDAO)
            }));

            (SensorRepository as jest.Mock).mockImplementation(() => ({
                getAllSensors: jest.fn().mockResolvedValue([])
            }));

            (mapGatewayDAOToDTO as jest.Mock).mockReturnValue(expectedDTO);

            const result = await gatewayController.getGateway("NET01", "00:11:22");
            expect(result).toEqual(expectedDTO);
            expect(mapGatewayDAOToDTO).toHaveBeenCalledWith(fakeGatewayDAO);
        });

        it("should handle repository errors", async () => {
            (GatewayRepository as jest.Mock).mockImplementation(() => ({
                getGatewayByAddress: jest.fn().mockRejectedValue(new Error("DB failure"))
            }));

            await expect(gatewayController.getGateway("NET01", "00:11:22")).rejects.toThrow(AppError);
            await expect(gatewayController.getGateway("NET01", "00:11:22")).rejects.toMatchObject({ status: 500 });
        });

        it("should throw NotFoundError when gateway not found", async () => {
            (GatewayRepository as jest.Mock).mockImplementation(() => ({
                getGatewayByAddress: jest.fn().mockRejectedValue(new NotFoundError("Gateway not found"))
            }));

            await expect(gatewayController.getGateway("NET01", "00:11:22")).rejects.toThrow(NotFoundError);
        });
    });

    // Update gateway
    describe("updateGateway", () => {
        it("should update a gateway", async () => {
            const gatewayDTO = {
                macAddress: "00:11:22",
                name: "Updated Gateway",
                description: "Updated description"
            };

            const mockUpdate = jest.fn().mockResolvedValue(undefined);
            (GatewayRepository as jest.Mock).mockImplementation(() => ({
                updateGateway: mockUpdate
            }));

            await expect(gatewayController.updateGateway("NET01", "00:11:22", gatewayDTO)).resolves.toBeUndefined();
            expect(mockUpdate).toHaveBeenCalledWith("NET01", "00:11:22", "00:11:22", "Updated Gateway", "Updated description");
        });

        it("should handle repository errors", async () => {
            const gatewayDTO = {
                macAddress: "00:11:22",
                name: "Updated Gateway",
                description: "Updated description"
            };

            (GatewayRepository as jest.Mock).mockImplementation(() => ({
                updateGateway: jest.fn().mockRejectedValue(new Error("DB failure"))
            }));

            await expect(gatewayController.updateGateway("NET01", "00:11:22", gatewayDTO)).rejects.toThrow(AppError);
            await expect(gatewayController.updateGateway("NET01", "00:11:22", gatewayDTO)).rejects.toMatchObject({ status: 500 });
        });

        it("should throw NotFoundError when gateway not found", async () => {
            const gatewayDTO = {
                macAddress: "00:11:22",
                name: "Updated Gateway",
                description: "Updated description"
            };

            (GatewayRepository as jest.Mock).mockImplementation(() => ({
                updateGateway: jest.fn().mockRejectedValue(new NotFoundError("Gateway not found"))
            }));

            await expect(gatewayController.updateGateway("NET01", "00:11:22", gatewayDTO)).rejects.toThrow(NotFoundError);
        });

        it("should throw ConflictError when new MAC address conflicts", async () => {
            const gatewayDTO = {
                macAddress: "NEW:MAC:ADDR", // Cambio di MAC address
                name: "Updated Gateway",
                description: "Updated description"
            };

            (GatewayRepository as jest.Mock).mockImplementation(() => ({
                updateGateway: jest.fn().mockRejectedValue(new ConflictError("MAC address already in use"))
            }));

            await expect(gatewayController.updateGateway("NET01", "00:11:22", gatewayDTO)).rejects.toThrow(ConflictError);
        });
    });

    // Delete gateway
    describe("deleteGateway", () => {
        it("should delete a gateway", async () => {
            (GatewayRepository as jest.Mock).mockImplementation(() => ({
                deleteGateway: jest.fn().mockResolvedValue([fakeGatewayDAO])
            }));

            const result = await gatewayController.deleteGateway("NET01", "00:11:22");
            expect(result).toEqual([fakeGatewayDAO]);
        });

        it("should handle repository errors", async () => {
            (GatewayRepository as jest.Mock).mockImplementation(() => ({
                deleteGateway: jest.fn().mockRejectedValue(new Error("DB failure"))
            }));

            await expect(gatewayController.deleteGateway("NET01", "00:11:22")).rejects.toThrow(AppError);
            await expect(gatewayController.deleteGateway("NET01", "00:11:22")).rejects.toMatchObject({ status: 500 });
        });
    });

    it("should throw NotFoundError when gateway not found", async () => {
        (GatewayRepository as jest.Mock).mockImplementation(() => ({
            deleteGateway: jest.fn().mockRejectedValue(new NotFoundError("Gateway not found"))
        }));

        await expect(gatewayController.deleteGateway("NET01", "00:11:22")).rejects.toThrow(NotFoundError);
    });

});
