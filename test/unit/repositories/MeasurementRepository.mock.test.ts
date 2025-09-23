import { MeasurementRepository } from "@repositories/MeasurementRepository";
import { SensorRepository } from "@repositories/SensorRepository";
import { AppDataSource } from "@database";
import { MeasurementDAO } from "@models/dao/MeasurementDAO";
import { Repository } from "typeorm"; 
import { findOrThrowNotFound } from "@utils";
import { SensorDAO } from "@models/dao/SensorDAO";
import { NotFoundError } from "@models/errors/NotFoundError";
import { Network } from "inspector/promises";
import { NetworkRepository } from "@repositories/NetworkRepository";
import { NetworkDAO } from "@models/dao/NetworkDAO";
import { GatewayDAO } from "@models/dao/GatewayDAO";

const mockFind = jest.fn();
const mockSave = jest.fn();

jest.mock("@database", () => ({
  AppDataSource: {
    getRepository: () => ({
      find: mockFind,
      save: mockSave,
    })
  }
}));

describe("MeasurementRepository: mocked database", () => {
    const fakeNetwork = new NetworkDAO();
    fakeNetwork.code = "NET01";
    const fakeGateway = new GatewayDAO();
    fakeGateway.macAddress = "GATE01";
    const repo = new MeasurementRepository();
    const fakeSensor = new SensorDAO();
    fakeSensor.macAddress = "71:B1:CE:01:C6:A9"; 
    const fakeSensorMac = "71:B1:CE:01:C6:A9";

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("create measurement", async () =>{    
        const networkCode = "NET01";
        const gatewayMac = "GATE01";
        const savedMeasurement = new MeasurementDAO();
        savedMeasurement.createdAt = new Date("2025-02-18T17:00:00+01:00").toISOString(),
        savedMeasurement.value = 3.5,
        savedMeasurement.isOutlier = false,
        savedMeasurement.sensor = fakeSensor;
        mockFind.mockResolvedValue([fakeNetwork]);
        mockFind.mockResolvedValue([fakeGateway]);
        mockFind.mockResolvedValue([fakeSensor]);
        mockSave.mockResolvedValue(savedMeasurement);
        const result = await repo.createMeasurement(networkCode, gatewayMac, fakeSensorMac ,savedMeasurement.createdAt, savedMeasurement.value);

            expect(result).toBeInstanceOf(MeasurementDAO);
            expect(result.createdAt).toBe(new Date("2025-02-18T17:00:00+01:00").toISOString());
            expect(result.value).toBe(3.5);
            expect(result.isOutlier).toBeFalsy();
            expect(mockSave).toHaveBeenCalled();
    });

   it("get measurements by Sensor: mocked database", async () => {
    const startDate = "2025-02-18T17:00:00+01:00";
    const endDate = "2025-02-18T19:00:00+01:00";

    const foundMeasurements: MeasurementDAO[] = [
        {createdAt: "2025-02-18T17:00:00+01:00", value : 3.4, sensor: fakeSensor} as MeasurementDAO,
        {createdAt: "2025-02-18T19:00:00+01:00", value : 5.13, sensor: fakeSensor} as MeasurementDAO
    ];

    mockFind.mockResolvedValue(foundMeasurements);

    const result = await repo.getMeasurementsBySensor("NET01", "GATE01", fakeSensorMac, "2025-02-18T17:00:00+01:00", "2025-02-18T19:00:00+01:00" );
        expect(result).toStrictEqual(foundMeasurements);
    })

    it("get measurement by Sensor: not found", async () => {
        mockFind.mockResolvedValue([]);

        await expect(repo.getMeasurementsBySensor("NET01", "GATE01", fakeSensor.macAddress, "2026-02-18T17:00:00+01:00", "2026-02-18T17:00:00+01:00"))
        .rejects.toThrow( NotFoundError );
    })

//   afterEach(() => {
//     jest.clearAllMocks();
//   });

});
