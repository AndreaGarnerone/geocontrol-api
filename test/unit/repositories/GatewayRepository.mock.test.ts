import { Repository } from "typeorm";
import { AppDataSource } from "@database";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { GatewayDAO } from "@dao/GatewayDAO";
import { NetworkDAO } from "@dao/NetworkDAO";
import { NetworkRepository } from "@repositories/NetworkRepository";
import { NotFoundError } from "@errors/NotFoundError";
import { ConflictError } from "@errors/ConflictError";

jest.mock("@database");
jest.mock("@repositories/NetworkRepository");

describe("GatewayRepository Unit Tests", () => {
    let gatewayRepo: GatewayRepository;
    let mockRepository: jest.Mocked<Repository<GatewayDAO>>;
    let mockNetworkRepository: jest.Mocked<NetworkRepository>;

    const mockNetwork: NetworkDAO = {
        networkId: 1,
        code: "NET01",
        name: "Test Network",
        description: "Test Description",
        gateways: [],
    };

    const mockGateway: GatewayDAO = {
        gatewayId: 1,
        macAddress: "00:11:22:33:44:55",
        name: "Test Gateway",
        description: "Test Description",
        network: mockNetwork,
        sensors: []
    };

    const getMacFromWhere = (where: any): string | null => {
        if (!where) return null;
        if (Array.isArray(where)) return null;
        return where.macAddress;
    };

    beforeEach(() => {
        jest.clearAllMocks();

        mockRepository = {
            find: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
        } as unknown as jest.Mocked<Repository<GatewayDAO>>;

        mockNetworkRepository = {
            getNetworkById: jest.fn(),
        } as unknown as jest.Mocked<NetworkRepository>;

        (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepository);

        (NetworkRepository as jest.Mock).mockImplementation(() => mockNetworkRepository);

        gatewayRepo = new GatewayRepository();
    });

    // getAllGateways
    describe("getAllGateways", () => {
        it("should return all gateways for network", async () => {
            const gateway1 = { ...mockGateway, macAddress: "A:B:C:D" };
            const gateway2 = { ...mockGateway, macAddress: "E:F:G:H" };

            mockNetworkRepository.getNetworkById.mockResolvedValue(mockNetwork);
            mockRepository.find.mockResolvedValue([gateway1, gateway2]);

            const result = await gatewayRepo.getAllGateways("NET01");

            expect(result).toEqual([gateway1, gateway2]);
            expect(mockRepository.find).toHaveBeenCalledWith({
                where: { network: { code: "NET01" } }
            });
        });

        it("should return empty array when no gateways", async () => {
            mockNetworkRepository.getNetworkById.mockResolvedValue(mockNetwork);
            mockRepository.find.mockResolvedValue([]);

            const result = await gatewayRepo.getAllGateways("NET01");

            expect(result).toEqual([]);
        });

        it("should throw NotFoundError when network not found", async () => {
            mockNetworkRepository.getNetworkById.mockRejectedValue(
                new NotFoundError("Network not found")
            );

            await expect(gatewayRepo.getAllGateways("NET02"))
                .rejects.toThrow(NotFoundError);
        });

        it("should handle generic errors", async () => {
            const genericError = new Error("Connection closed: cannot execute operation");
            mockNetworkRepository.getNetworkById.mockRejectedValue(genericError);

            await expect(gatewayRepo.getAllGateways("NET01"))
                .rejects.toThrow(genericError);
        });
    });

    // getGatewayByAddress
    describe("getGatewayByAddress", () => {
        it("should return gateway when found", async () => {
            const gateway = { ...mockGateway, macAddress: "A:B:C:D" };

            mockNetworkRepository.getNetworkById.mockResolvedValue(mockNetwork);
            mockRepository.find.mockResolvedValue([gateway]);

            const result = await gatewayRepo.getGatewayByAddress("NET01", "A:B:C:D");

            expect(result.macAddress).toBe("A:B:C:D");
            expect(mockRepository.find).toHaveBeenCalledWith({
                where: {
                    network: { code: "NET01" },
                    macAddress: "A:B:C:D"
                }
            });
        });

        it("should throw NotFoundError when gateway not found", async () => {
            mockNetworkRepository.getNetworkById.mockResolvedValue(mockNetwork);
            mockRepository.find.mockResolvedValue([]);

            await expect(
                gatewayRepo.getGatewayByAddress("NET01", "NOT:EXIST")
            ).rejects.toThrow(NotFoundError);
        });

        it("should handle network not found", async () => {
            mockNetworkRepository.getNetworkById.mockRejectedValue(
                new NotFoundError("Network not found")
            );

            await expect(
                gatewayRepo.getGatewayByAddress("INVALID", "A:B:C:D")
            ).rejects.toThrow(NotFoundError);
        });
    });

    // createGateways
    describe("createGateways", () => {
        it("should create new gateway successfully", async () => {
            mockNetworkRepository.getNetworkById.mockResolvedValue(mockNetwork);
            mockRepository.find.mockResolvedValue([]);
            mockRepository.save.mockResolvedValue(mockGateway);

            const result = await gatewayRepo.createGateways(
                "NET01",
                "00:11:22:33:44:55",
                "Test Gateway",
                "Test Description"
            );

            expect(result).toEqual(mockGateway);
            expect(mockRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    macAddress: "00:11:22:33:44:55",
                    name: "Test Gateway",
                    description: "Test Description",
                })
            );
        });

        it("should throw ConflictError when gateway already exists", async () => {
            mockNetworkRepository.getNetworkById.mockResolvedValue(mockNetwork);
            mockRepository.find.mockResolvedValue([mockGateway]);

            await expect(
                gatewayRepo.createGateways("NET01", "00:11:22:33:44:55")
            ).rejects.toThrow(ConflictError);

            expect(mockRepository.save).not.toHaveBeenCalled();
        });

        it("should handle network not found", async () => {
            mockNetworkRepository.getNetworkById.mockRejectedValue(
                new NotFoundError("Network not found")
            );

            await expect(
                gatewayRepo.createGateways("INVALID", "00:11:22:33:44:55")
            ).rejects.toThrow(NotFoundError);
        });
    });

    // updateGateway
    describe("updateGateway", () => {
        it("should update gateway successfully without MAC change", async () => {
            const networkCode = "NET01";
            const macAddress = "00:11:22:33:44:55";

            mockNetworkRepository.getNetworkById.mockResolvedValue(mockNetwork);

            // Configura find per gateway esistente e nessun conflitto
            mockRepository.find.mockImplementation(async (options) => {
                const mac = getMacFromWhere(options?.where);
                if (mac === macAddress) return [mockGateway];
                return [];
            });

            mockRepository.update.mockResolvedValue({ affected: 1 } as any);

            await gatewayRepo.updateGateway(
                networkCode,
                macAddress,
                macAddress, // Stesso MAC
                "Updated Name",
                "Updated Description"
            );

            expect(mockRepository.update).toHaveBeenCalledWith(
                { macAddress },
                expect.objectContaining({
                    macAddress,
                    name: "Updated Name",
                    description: "Updated Description",
                    network: expect.objectContaining({
                        code: networkCode
                    })
                })
            );
        });

        it("should update gateway successfully with MAC change", async () => {
            const networkCode = "NET01";
            const originalMac = "00:11:22:33:44:55";
            const updatedMac = "AA:BB:CC:DD:EE:FF";

            mockNetworkRepository.getNetworkById.mockResolvedValue(mockNetwork);

            // Configura find
            mockRepository.find.mockImplementation(async (options) => {
                const mac = getMacFromWhere(options?.where);
                if (mac === originalMac) return [mockGateway];
                if (mac === updatedMac) return [];
                return [];
            });

            mockRepository.update.mockResolvedValue({ affected: 1 } as any);

            await gatewayRepo.updateGateway(
                networkCode,
                originalMac,
                updatedMac,
                "New Name",
                "New Description"
            );

            expect(mockRepository.update).toHaveBeenCalledWith(
                { macAddress: originalMac },
                expect.objectContaining({
                    macAddress: updatedMac,
                    name: "New Name",
                    description: "New Description"
                })
            );
        });

        it("should throw NotFoundError when gateway not found", async () => {
            const networkCode = "NET01";
            const originalMac = "00:11:22:33:44:55";
            const updatedMac = "AA:BB:CC:DD:EE:FF";

            mockNetworkRepository.getNetworkById.mockResolvedValue(mockNetwork);
            mockRepository.find.mockResolvedValue([]);

            await expect(gatewayRepo.updateGateway(
                networkCode,
                originalMac,
                updatedMac
            )).rejects.toThrow(NotFoundError);

            expect(mockRepository.find).toHaveBeenCalledWith({
                where: {
                    network: { code: networkCode },
                    macAddress: originalMac
                }
            });
            expect(mockRepository.update).not.toHaveBeenCalled();
        });

        it("should throw ConflictError when new MAC address already exists", async () => {
            const networkCode = "NET01";
            const originalMac = "00:11:22:33:44:55";
            const updatedMac = "AA:BB:CC:DD:EE:FF";

            const conflictingGateway = { ...mockGateway, macAddress: updatedMac };

            mockNetworkRepository.getNetworkById.mockResolvedValue(mockNetwork);

            // Configura find
            mockRepository.find.mockImplementation(async (options) => {
                const mac = getMacFromWhere(options?.where);
                if (mac === originalMac) return [mockGateway];
                if (mac === updatedMac) return [conflictingGateway];
                return [];
            });

            await expect(gatewayRepo.updateGateway(
                networkCode,
                originalMac,
                updatedMac
            )).rejects.toThrow(ConflictError);

            expect(mockRepository.update).not.toHaveBeenCalled();
        });

        it("should handle partial updates", async () => {
            const networkCode = "NET01";
            const macAddress = "00:11:22:33:44:55";

            mockNetworkRepository.getNetworkById.mockResolvedValue(mockNetwork);
            mockRepository.find.mockResolvedValue([mockGateway]);
            mockRepository.update.mockResolvedValue({ affected: 1 } as any);

            await gatewayRepo.updateGateway(
                networkCode,
                macAddress,
                undefined,
                "New Name",
                undefined
            );

            expect(mockRepository.update).toHaveBeenCalled();
        });

        it("should handle network not found", async () => {
            mockNetworkRepository.getNetworkById.mockRejectedValue(
                new NotFoundError("Network not found")
            );

            await expect(
                gatewayRepo.updateGateway("INVALID", "00:11:22", "AA:BB:CC")
            ).rejects.toThrow(NotFoundError);
        });
    });

    // deleteGateway
    describe("deleteGateway", () => {
        it("should delete gateway successfully", async () => {
            const gateway = { ...mockGateway, macAddress: "DEL:MAC" };

            mockNetworkRepository.getNetworkById.mockResolvedValue(mockNetwork);
            mockRepository.find.mockResolvedValue([gateway]);
            mockRepository.remove.mockResolvedValue([gateway] as any);

            const result = await gatewayRepo.deleteGateway("NET01", "DEL:MAC");

            expect(mockRepository.remove).toHaveBeenCalledWith([gateway]);
            expect(result).toEqual([gateway]);
        });

        it("should throw NotFoundError when gateway not found", async () => {
            mockNetworkRepository.getNetworkById.mockResolvedValue(mockNetwork);
            mockRepository.find.mockResolvedValue([]);

            await expect(
                gatewayRepo.deleteGateway("NET01", "XXX")
            ).rejects.toThrow(NotFoundError);
        });

        it("should handle network not found", async () => {
            mockNetworkRepository.getNetworkById.mockRejectedValue(
                new NotFoundError("Network not found")
            );

            await expect(
                gatewayRepo.deleteGateway("INVALID", "00:11:22")
            ).rejects.toThrow(NotFoundError);
        });

        it("should handle generic errors", async () => {
            mockNetworkRepository.getNetworkById.mockResolvedValue(mockNetwork);

            const genericError = new Error("Delete failed");
            mockRepository.find.mockRejectedValue(genericError);

            await expect(
                gatewayRepo.deleteGateway("NET01", "00:11:22")
            ).rejects.toThrow("Delete failed");
        });
    });
});