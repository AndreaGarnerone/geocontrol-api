import {
  getAllNetworks,
  getNetwork,
  createNetwork,
  deleteNetwork,
  updateNetwork,
} from "@controllers/networkController";
import { Network as NetworkDTO } from "@dto/Network";
import { NetworkRepository } from "@repositories/NetworkRepository";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { SensorRepository } from "@repositories/SensorRepository";
import { NotFoundError } from "@models/errors/NotFoundError";
import { ConflictError } from "@models/errors/ConflictError";
import { NetworkDAO } from "@dao/NetworkDAO";

// Mock all repositories
jest.mock("@repositories/NetworkRepository");
jest.mock("@repositories/GatewayRepository");
jest.mock("@repositories/SensorRepository");

const mockNetworkRepo = NetworkRepository as jest.MockedClass<
  typeof NetworkRepository
>;
const mockGatewayRepo = GatewayRepository as jest.MockedClass<
  typeof GatewayRepository
>;
const mockSensorRepo = SensorRepository as jest.MockedClass<
  typeof SensorRepository
>;

// Sample data
const sampleNetworkDAO: NetworkDAO = {
  networkId: 1,
  code: "test_net",
  name: "Test Network",
  description: "Test Description",
  gateways: [],
};

const sampleNetworkDTO: NetworkDTO = {
  code: "test_net",
  name: "Test Network",
  description: "Test Description",
  gateways: [],
};

const sampleGateway = {
  macAddress: "00:11:22:33:44:55",
  name: "Test Gateway",
  description: "Gateway desc",
  sensors: [],
};

const sampleSensor = {
  macAddress: "AA:BB:CC:DD:EE:FF",
  variable: "temperature",
  name: "Test Sensor",
  description: "Sensor desc",
  unit : "Celsius",
};

describe("Network Controller Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset all mock implementations
    mockNetworkRepo.mockClear();
    mockGatewayRepo.mockClear();
    mockSensorRepo.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Get All Networks
  describe("getAllNetworks", () => {
    it("should return networks with gateways and sensors", async () => {
      // Mock repository responses
      const mockGetAllNetworks = jest
        .fn()
        .mockResolvedValue([sampleNetworkDAO]);
      const mockGetAllGateways = jest.fn().mockResolvedValue([sampleGateway]);
      const mockGetAllSensors = jest.fn().mockResolvedValue([sampleSensor]);

      mockNetworkRepo.prototype.getAllNetworks = mockGetAllNetworks;
      mockGatewayRepo.prototype.getAllGateways = mockGetAllGateways;
      mockSensorRepo.prototype.getAllSensors = mockGetAllSensors;

      const result = await getAllNetworks();

      expect(result).toEqual([
        {
          ...sampleNetworkDTO,
          gateways: [
            {
              ...sampleGateway,
              sensors: [sampleSensor],
            },
          ],
        },
      ]);

      expect(mockGetAllNetworks).toHaveBeenCalledTimes(1);
      expect(mockGetAllGateways).toHaveBeenCalledWith("test_net");
      expect(mockGetAllSensors).toHaveBeenCalledWith(
        "test_net",
        "00:11:22:33:44:55"
      );
    });

    it("should handle empty networks", async () => {
      mockNetworkRepo.prototype.getAllNetworks = jest
        .fn()
        .mockResolvedValue([]);

      const result = await getAllNetworks();
      expect(result).toEqual([]);
    });

    it("should handle repository errors", async () => {
      mockNetworkRepo.prototype.getAllNetworks = jest
        .fn()
        .mockRejectedValue(new Error("DB error"));

      await expect(getAllNetworks()).rejects.toThrow("DB error");
    });
  });

  // Create Network
  describe("createNetwork", () => {
    it("should create a network", async () => {
      mockNetworkRepo.prototype.createNetwork = jest
          .fn()
          .mockResolvedValue(undefined);

      await createNetwork(sampleNetworkDTO);

      expect(mockNetworkRepo.prototype.createNetwork).toHaveBeenCalledWith(
          "test_net",
          "Test Network",
          "Test Description"
      );
    });

    it("should throw ConflictError when network code exists", async () => {
      mockNetworkRepo.prototype.createNetwork = jest
          .fn()
          .mockRejectedValue(new ConflictError("Network exists"));

      await expect(createNetwork(sampleNetworkDTO)).rejects.toThrow(
          ConflictError
      );
    });

    it("should handle other repository errors", async () => {
      mockNetworkRepo.prototype.createNetwork = jest
          .fn()
          .mockRejectedValue(new Error("DB error"));

      await expect(createNetwork(sampleNetworkDTO)).rejects.toThrow("DB error");
    });
  });

  // Get Network
  describe("getNetwork", () => {
    it("should return a network with gateways and sensors", async () => {
      // Mock repository responses
      mockNetworkRepo.prototype.getNetworkById = jest
        .fn()
        .mockResolvedValue(sampleNetworkDAO);
      mockGatewayRepo.prototype.getAllGateways = jest
        .fn()
        .mockResolvedValue([sampleGateway]);
      mockSensorRepo.prototype.getAllSensors = jest
        .fn()
        .mockResolvedValue([sampleSensor]);

      const result = await getNetwork("test_net");

      expect(result).toEqual({
        ...sampleNetworkDTO,
        gateways: [
          {
            ...sampleGateway,
            sensors: [sampleSensor],
          },
        ],
      });

      expect(mockNetworkRepo.prototype.getNetworkById).toHaveBeenCalledWith(
        "test_net"
      );
      expect(mockGatewayRepo.prototype.getAllGateways).toHaveBeenCalledWith(
        "test_net"
      );
      expect(mockSensorRepo.prototype.getAllSensors).toHaveBeenCalledWith(
        "test_net",
        "00:11:22:33:44:55"
      );
    });

    it("should throw NotFoundError when network not found", async () => {
      mockNetworkRepo.prototype.getNetworkById = jest
        .fn()
        .mockRejectedValue(new NotFoundError("Network not found"));

      await expect(getNetwork("invalid_code")).rejects.toThrow(NotFoundError);
    });

    it("should handle other repository errors", async () => {
      mockNetworkRepo.prototype.getNetworkById = jest
        .fn()
        .mockRejectedValue(new Error("DB error"));

      await expect(getNetwork("test_net")).rejects.toThrow("DB error");
    });
  });

  // Update Network
  describe("updateNetwork", () => {
    const updatedNetwork: NetworkDTO = {
      code: "new_code",
      name: "Updated Network",
      description: "Updated Description",
      gateways: [],
    };

    it("should update a network", async () => {
      mockNetworkRepo.prototype.updateNetwork = jest
        .fn()
        .mockResolvedValue(undefined);

      await updateNetwork("old_code", updatedNetwork);

      expect(mockNetworkRepo.prototype.updateNetwork).toHaveBeenCalledWith(
        "old_code",
        "new_code",
        "Updated Network",
        "Updated Description"
      );
    });

    it("should throw NotFoundError when network not found", async () => {
      mockNetworkRepo.prototype.updateNetwork = jest
        .fn()
        .mockRejectedValue(new NotFoundError("Network not found"));

      await expect(updateNetwork("old_code", updatedNetwork)).rejects.toThrow(
        NotFoundError
      );
    });

    it("should throw ConflictError when new code exists", async () => {
      mockNetworkRepo.prototype.updateNetwork = jest
        .fn()
        .mockRejectedValue(new ConflictError("Code conflict"));

      await expect(updateNetwork("old_code", updatedNetwork)).rejects.toThrow(
        ConflictError
      );
    });

    it("should handle other repository errors", async () => {
      mockNetworkRepo.prototype.updateNetwork = jest
        .fn()
        .mockRejectedValue(new Error("DB error"));

      await expect(updateNetwork("old_code", updatedNetwork)).rejects.toThrow(
        "DB error"
      );
    });
  });

  // Delete Network
  describe("deleteNetwork", () => {
    it("should delete a network", async () => {
      mockNetworkRepo.prototype.deleteNetwork = jest
          .fn()
          .mockResolvedValue(undefined);

      await deleteNetwork("test_net");

      expect(mockNetworkRepo.prototype.deleteNetwork).toHaveBeenCalledWith(
          "test_net"
      );
    });

    it("should throw NotFoundError when network not found", async () => {
      mockNetworkRepo.prototype.deleteNetwork = jest
          .fn()
          .mockRejectedValue(new NotFoundError("Network not found"));

      await expect(deleteNetwork("invalid_code")).rejects.toThrow(
          NotFoundError
      );
    });

    it("should handle other repository errors", async () => {
      mockNetworkRepo.prototype.deleteNetwork = jest
          .fn()
          .mockRejectedValue(new Error("DB error"));

      await expect(deleteNetwork("test_net")).rejects.toThrow("DB error");
    });
  });
});
