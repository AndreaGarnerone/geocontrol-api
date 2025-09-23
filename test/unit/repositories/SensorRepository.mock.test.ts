import { SensorRepository } from "@repositories/SensorRepository";
import { SensorDAO } from "@models/dao/SensorDAO";
import { BadRequest } from "express-openapi-validator/dist/openapi.validator";

jest.mock("@dao/SensorDAO", () => ({ SensorDAO: class {} }));
jest.mock("@dao/GatewayDAO", () => ({ GatewayDAO: class {} }));

jest.mock("@repositories/NetworkRepository", () => ({
  NetworkRepository: jest.fn().mockImplementation(() => ({
    getNetworkById: jest.fn().mockResolvedValue({ networkCode: "N1" }),
  })),
}));

jest.mock("@repositories/GatewayRepository", () => ({
  GatewayRepository: jest.fn().mockImplementation(() => ({
    getGatewayByAddress: jest.fn().mockResolvedValue({ macAddress: "GW1" }),
  })),
}));

jest.mock("@database", () => ({
  AppDataSource: {
    getRepository: () => ({
      find: mockFind,
      save: mockSave,
      remove: mockRemove,
      update: mockUpdate,
    }),
  },
}));

jest.mock("@utils", () => ({
  findOrThrowNotFound: jest.fn((arr: any[], pred: any, msg: string) => {
    if (!arr || arr.length === 0) throw new (require("@errors/NotFoundError").NotFoundError)(msg);
    return arr[0];
  }),
  throwConflictIfFound: jest.fn((arr: any[], pred: any, msg: string) => {
    if (arr && arr.length > 0) throw new Error(msg);
  }),
}));

const mockFind = jest.fn();
const mockSave = jest.fn();
const mockRemove = jest.fn();
const mockUpdate = jest.fn();

describe("SensorRepository: mocked database", () => {
  let sensorRepo: SensorRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    sensorRepo = new SensorRepository();
  });

  // getAllSensors
  describe("getAllSensors", () => {
    it("should return all sensors for a gateway", async () => {
      const foundSensor1 = new SensorDAO();
      foundSensor1.macAddress = "S1";
      foundSensor1.name = "Sensor1";
      foundSensor1.description = "Description";
      foundSensor1.variable = "Temperature";
      foundSensor1.unit = "Celsius";
      const foundSensor2 = new SensorDAO();
      foundSensor2.macAddress = "S2";
      foundSensor2.name = "Sensor2";
      foundSensor2.description = "Description";
      foundSensor2.variable = "Humidity";
      foundSensor2.unit = "Percentage";
      mockFind.mockResolvedValue([foundSensor1, foundSensor2]);
      const result = await sensorRepo.getAllSensors("N1", "GW1");
      expect(result).toEqual([foundSensor1, foundSensor2]);
    });

    it("should return empty array when no sensors", async () => {
      mockFind.mockResolvedValue([]);
      const result = await sensorRepo.getAllSensors("N1", "GW1");
      expect(result).toEqual([]);
    });

    it("should throw not found when gateway not found", async () => {
      const gatewayRepo = require("@repositories/GatewayRepository");
      gatewayRepo.GatewayRepository.mockImplementationOnce(() => ({
        getGatewayByAddress: jest.fn().mockResolvedValue(null),
      }));
      await expect(sensorRepo.getAllSensors("N1", "GW1"))
          .rejects.toThrow("Gateway with macAddress 'GW1' not found");
    });

    it("should throw not found when network not found", async () => {
      const networkRepo = require("@repositories/NetworkRepository");
      networkRepo.NetworkRepository.mockImplementationOnce(() => ({
        getNetworkById: jest.fn().mockResolvedValue(null),
      }));
      await expect(sensorRepo.getAllSensors("N1", "GW1"))
          .resolves.toEqual([]);
    });
  });

  // createSensor
  describe("createSensor", () => {
    it("should create new sensor", async () => {
      mockFind.mockResolvedValue([]);
      const sensor = {
        networkCode: "N1",
        gateway: { macAddress: "GW1" },
        macAddress: "S1",
        name: "Sensor1",
        description: "Description",
        variable: "Temperature",
        unit: "Celsius"
      };
      mockSave.mockResolvedValue(sensor);
      const result = await sensorRepo.createSensor("N1", "GW1", "S1", "Sensor1", "Description", "Temperature", "Celsius");
      expect(result).toMatchObject(sensor);
      expect(result.macAddress).toBe("S1");
      expect(result.name).toBe("Sensor1");
      expect(result.description).toBe("Description");
      expect(result.variable).toBe("Temperature");
      expect(result.unit).toBe("Celsius");
      expect(mockSave).toHaveBeenCalledWith({
        macAddress: "S1",
        name: "Sensor1",
        description: "Description",
        variable: "Temperature",
        unit: "Celsius",
        gateway: { macAddress: "GW1" }
      });
    });

    it("should throw conflict found when sensor already exists", async () => {
      const existingSensor = new SensorDAO();
      existingSensor.macAddress = "S1";
      existingSensor.name = "Sensor1";
      existingSensor.description = "Description";
      existingSensor.variable = "Temperature";
      existingSensor.unit = "Celsius";
      mockFind.mockResolvedValue([existingSensor]);
      await expect(sensorRepo.createSensor("N1", "GW1", "S1", "Sensor1", "Description", "Temperature", "Celsius"))
        .rejects.toThrow("Sensor with macAddress 'S1' already exists");
    });

    it("should handle null parameter", async () => {
      const existingSensor = new SensorDAO();
      existingSensor.macAddress = "S1";
      existingSensor.name = "Sensor1";
      existingSensor.description = "Description";
      existingSensor.variable = "Temperature";
      existingSensor.unit = "Celsius";
      mockFind.mockResolvedValue([existingSensor]);
      await expect(sensorRepo.createSensor("N1", "GW1", null, "Sensor1", "Description", "Temperature", "Celsius"))
        .rejects.toThrow(BadRequest);
    });
  });

  describe("getSensorById", () => {
    it("should return sensors when found", async () => {
      const foundSensor = new SensorDAO();
      foundSensor.macAddress = "S1";
      foundSensor.name = "Sensor1";
      foundSensor.description = "Description";
      foundSensor.variable = "Temperature";
      foundSensor.unit = "Celsius";
      mockFind.mockResolvedValue([foundSensor]);
      const result = await sensorRepo.getSensorById("N1", "GW1", "S1");
      expect(result).toBe(foundSensor);
      expect(result.macAddress).toBe("S1");
      expect(result.name).toBe("Sensor1");
    });

    it("should throw not found when sensor not found", async () => {
      mockFind.mockResolvedValue([]);
      await expect(sensorRepo.getSensorById("N1", "GW1", "S1"))
        .rejects.toThrow("Sensor with id 'S1' not found");
    });

    it("should throw not found when network not found", async () => {
      const networkRepo = require("@repositories/NetworkRepository");
      networkRepo.NetworkRepository.mockImplementationOnce(() => ({
        getNetworkById: jest.fn().mockResolvedValue(null),
      }));
      await expect(sensorRepo.getSensorById("N1", "GW1", "S1"))
        .rejects.toThrow("Sensor with id 'S1' not found");
    });
  });

  describe("updateSensor", () => {
    it("should update sensor successfully without code change", async () => {
      const foundSensor = new SensorDAO();
      foundSensor.macAddress = "S1";
      foundSensor.name = "Sensor1";
      foundSensor.description = "Description";
      foundSensor.variable = "Temperature";
      foundSensor.unit = "Celsius";
      mockFind.mockResolvedValueOnce([foundSensor])
        .mockResolvedValueOnce([]);
      mockUpdate.mockResolvedValue(foundSensor);
      const result = await sensorRepo.updateSensor("N1", "GW1", "S1", "S2", "Sensor2", "New Description", "Humidity", "Percentage");
      expect(result).toBeUndefined();
      expect(mockUpdate).toHaveBeenCalled();
    });

    it("should throw not found when sensor not found", async () => {
      mockFind.mockResolvedValue([]);
      await expect(sensorRepo.updateSensor("N1", "GW1", "S1", "S2", "Sensor2", "New Description", "Humidity", "Percentage"))
        .rejects.toThrow("Sensor with id 'S1' not found");
    });

    it("should call conflict found", async () => {
      const existingSensor = new SensorDAO();
      existingSensor.macAddress = "S2";
      existingSensor.name = "Sensor2";
      existingSensor.description = "Description";
      existingSensor.variable = "Temperature";
      existingSensor.unit = "Celsius";
      mockFind.mockResolvedValue([existingSensor]);
      await expect(sensorRepo.updateSensor("N1", "GW1", "S1", "S2", "Sensor2", "New Description", "Humidity", "Percentage"))
        .rejects.toThrow("Sensor with macAddress 'S2' already exists");
    });

    it("should handle null parameter", async () => {
      const foundSensor = new SensorDAO();
      foundSensor.macAddress = "S1";
      foundSensor.name = "Sensor1";
      foundSensor.description = "Description";
      foundSensor.variable = "Temperature";
      foundSensor.unit = "Celsius";
      mockFind.mockResolvedValue([foundSensor]);
      await expect(sensorRepo.updateSensor("N1", "GW1", "S1", null, "Sensor2", "New Description", "Humidity", "Percentage"))
        .rejects.toThrow(BadRequest);
    });

    it("should handle gateway not found", async () => {
      const gatewayRepo = require("@repositories/GatewayRepository");
      gatewayRepo.GatewayRepository.mockImplementationOnce(() => ({
        getGatewayByAddress: jest.fn().mockResolvedValue(null),
      }));
      await expect(sensorRepo.updateSensor("N1", "GW1", "S1", "S2", "Sensor2", "New Description", "Humidity", "Percentage"))
        .rejects.toThrow("Gateway with macAddress 'GW1' not found");
    });
  });

  describe("deleteSensor", () => {
    it("should delete sensor", async () => {
      const foundSensor = new SensorDAO();
      foundSensor.macAddress = "S1";
      foundSensor.name = "Sensor1";
      foundSensor.description = "Description";
      foundSensor.variable = "Temperature";
      foundSensor.unit = "Celsius";
      mockFind.mockResolvedValue([foundSensor]);
      mockRemove.mockResolvedValue(foundSensor);
      await sensorRepo.deleteSensor("N1", "GW1", "S1");
      expect(mockRemove).toHaveBeenCalledWith(foundSensor);
    });

    it("should throw not found error when sensor not found", async () => {
      mockFind.mockResolvedValue([]);
      await expect(sensorRepo.deleteSensor("N1", "GW1", "S1"))
        .rejects.toThrow("Sensor with id 'S1' not found");
    });
  });

});