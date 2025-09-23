import { MeasurementRepository } from "@repositories/MeasurementRepository";
import {
  initializeTestDataSource,
  closeTestDataSource,
  TestDataSource
} from "@test/setup/test-datasource";
import { MeasurementDAO } from "@dao/MeasurementDAO";
import { SensorDAO } from "@dao/SensorDAO";
import { GatewayDAO } from "@dao/GatewayDAO";
import { NetworkDAO } from "@dao/NetworkDAO";
import { NotFoundError } from "@models/errors/NotFoundError";
import { NetworkRepository } from "@repositories/NetworkRepository";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { SensorRepository } from "@repositories/SensorRepository";

beforeAll(async () => {
    await initializeTestDataSource();
});

afterAll(async () => {
  await closeTestDataSource();
});

beforeEach(async () => {
    await TestDataSource.getRepository(MeasurementDAO).clear();
    await TestDataSource.getRepository(SensorDAO).clear();
    await TestDataSource.getRepository(GatewayDAO).clear();
    await TestDataSource.getRepository(NetworkDAO).clear();
    });

describe("MeasurementRepository: SQLite in-memory", () => {
    const repo = new MeasurementRepository();
    
    it("create measurement", async () => {
        const NetworkRepo = new NetworkRepository();
        await NetworkRepo.createNetwork("NET01", "netprova", "prova");
        const gatewayRepo = new GatewayRepository();
        await gatewayRepo.createGateways("NET01","GATE01","gateprova", "descrizione prova");
        const sensorRepo = new SensorRepository();
        await sensorRepo.createSensor("NET01", "GATE01", "SENS01", "SENSPROVA", " DESCRIZIONE PROVA", "VARIABILE PROVA", "UNIT PROVA" );

        const measurement  = await repo.createMeasurement("NET01", "GATE01", "SENS01", "2025-02-18T17:00:00+01:00", 11.323 );
        expect(measurement.value).toBeCloseTo(11.323);
        expect(new Date(measurement.createdAt).toISOString()).toEqual(new Date("2025-02-18T17:00:00+01:00").toISOString());
        const found = await repo.getMeasurementsBySensor("NET01", "GATE01", "SENS01", new Date("2025-02-18T17:00:00+01:00").toISOString(), new Date("2025-02-18T18:00:00+01:00").toISOString());
        expect(found[0].value).toBeCloseTo(11.323, 3);
        const foundNoParams = await repo.getMeasurementsBySensor("NET01", "GATE01", "SENS01");
        expect(foundNoParams[0].value).toBeCloseTo(11.323,3);

    });

    it("get measurements by sensor: not found", async () => {

        await expect(repo.getMeasurementsBySensor("NET01", "GATE01","UNKNOWN_SENSOR")).rejects.toThrow(
            NotFoundError
        );
    });

});
