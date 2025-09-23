import * as userController from "@controllers/userController";
import { MeasurementDAO } from "@models/dao/MeasurementDAO";
import { MeasurementRepository } from "@repositories/MeasurementRepository";
import {
  initializeTestDataSource,
  closeTestDataSource,
  TestDataSource
} from "@test/setup/test-datasource";
import { SensorDAO } from "@dao/SensorDAO";
import { GatewayDAO } from "@dao/GatewayDAO";
import { NetworkDAO } from "@dao/NetworkDAO";
import { Measurement as MeasurementDTO } from "@models/dto/Measurement";
import { Measurements as MeasurementsDTO } from "@models/dto/Measurements";
import { NetworkRepository } from "@repositories/NetworkRepository";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { SensorRepository } from "@repositories/SensorRepository";
import * as measurementController from "@controllers/measurementController";
import * as Mapper from "@services/mapperService";
import { Stats as StatsDTO} from "@models/dto/Stats";

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

    const NetworkRepo = new NetworkRepository();
    await NetworkRepo.createNetwork("NET01", "netprova", "prova");
    const gatewayRepo = new GatewayRepository();
    await gatewayRepo.createGateways("NET01","GATE01","gateprova", "descrizione prova");
    const sensorRepo = new SensorRepository();
    await sensorRepo.createSensor("NET01", "GATE01", "SENS01", "SENSPROVA", " DESCRIZIONE PROVA", "VARIABILE PROVA", "UNIT PROVA" );
    // gate2 e sensore2
    await gatewayRepo.createGateways("NET01","GATE02","gateprova", "descrizione prova");
    await sensorRepo.createSensor("NET01", "GATE02", "SENS02", "SENSPROVA", " DESCRIZIONE PROVA", "VARIABILE PROVA", "UNIT PROVA" );

});

//create measurements
describe("measurementController integration test", () =>{
    const repo = new MeasurementRepository();
    const networkCode = "NET01";
    const gatewayMac = "GATE01";
    const sensorMac = "SENS01";

    it("Create Measurement", async ()=> {
        
        const measurementDTO : MeasurementDTO = {
            createdAt: new Date("2025-05-29T12:00:00Z"),
            value: 12.5,
        }

        await measurementController.createMeasurement(
            "NET01", "GATE01", "SENS01",
            measurementDTO
        );

        await repo.createMeasurement("NET01", "GATE01", "SENS01", measurementDTO.createdAt.toUTCString(), 12.5);

        const expectedDTO = { 
            createdAt: new Date("2025-05-29T12:00:00Z").toUTCString(),
            value: 12.5,
            isOutlier: false
        }

        const foundDTO = await repo.getMeasurementsBySensor("NET01", "GATE01", "SENS01");

        expect(foundDTO[0]).toMatchObject(expectedDTO);
    });

    it("Get measurements for a specific Sensor", async () =>{
        await repo.createMeasurement("NET01", "GATE01", "SENS01", "2025-05-29T10:00:00Z", 10);
        await repo.createMeasurement("NET01", "GATE01", "SENS01", "2025-05-29T11:00:00Z", 15);
        await repo.createMeasurement("NET01", "GATE01", "SENS01", "2025-05-29T11:30:00Z", 20);

        await measurementController.getMeasurementsBySensor(networkCode, gatewayMac, sensorMac,) // recupero senza startDate e endDate
        await measurementController.getMeasurementsBySensor(networkCode,gatewayMac, sensorMac, "2025-05-29T10:00:00Z", "2025-05-29T13:00:00Z"); //Recupero con startDate e endDate definiti

        const foundWODate = await repo.getMeasurementsBySensor(networkCode, gatewayMac, sensorMac);
        const foundWithDate = await repo.getMeasurementsBySensor(networkCode, gatewayMac, sensorMac, "2025-05-29T10:00:00Z", "2025-05-29T13:00:00Z")
        
        const expectedfound = [
        {
            createdAt: new Date("2025-05-29T10:00:00Z").toUTCString(),
            value: 10
        },
        {
            createdAt: new Date("2025-05-29T11:00:00Z").toUTCString(),
            value: 15
        },
        {
            createdAt: new Date("2025-05-29T11:30:00Z").toUTCString(),
            value: 20
        }];
         
        let i =  0;
        for (const m of foundWODate){
            expect(m).toMatchObject(expectedfound[i]);
            i++;
        }
        
        i = 0;
        for (const m of foundWithDate){
            expect(m).toMatchObject(expectedfound[i]);
            i++;
        }
        
        const values = [10, 15, 20];
        const foundStats = Mapper.calculateStats( values, new Date("2025-05-29T10:00:00Z"), new Date("2025-05-29T13:00:00Z"));
        const expectedStats : StatsDTO = {
            startDate: new Date("2025-05-29T10:00:00Z"),
            endDate: new Date("2025-05-29T13:00:00Z"),
            mean: 15,
            variance: 16.666666666666668,
            lowerThreshold: 6.835034190722739,
            upperThreshold: 23.164965809277263
            }

        expect(foundStats).toMatchObject(expectedStats);
        expect(foundStats.startDate).toStrictEqual(expectedStats.startDate);
        expect(foundStats.endDate).toStrictEqual(expectedStats.endDate);
        expect(foundStats.mean).toBeCloseTo(expectedStats.mean);
        expect(foundStats.variance).toBeCloseTo(expectedStats.variance);
        expect(foundStats.lowerThreshold).toBeCloseTo(expectedStats.lowerThreshold);
        expect(foundStats.upperThreshold).toBeCloseTo(expectedStats.upperThreshold);
        
    });

    it("Get Outliers for a specific Sensor", async () => {
        await repo.createMeasurement("NET01", "GATE01", "SENS01", "2025-05-29T10:00:00Z", 1);
        await repo.createMeasurement("NET01", "GATE01", "SENS01", "2025-05-29T11:00:00Z", 2);
        await repo.createMeasurement("NET01", "GATE01", "SENS01", "2025-05-29T11:20:00Z", 1);
        await repo.createMeasurement("NET01", "GATE01", "SENS01", "2025-05-29T11:30:00Z", 2);
        await repo.createMeasurement("NET01", "GATE01", "SENS01", "2025-05-29T11:40:00Z", 3);
        await repo.createMeasurement("NET01", "GATE01", "SENS01", "2025-05-29T12:00:00Z", 50);

        await measurementController.getOutlierMeasurementsBySensor(networkCode, gatewayMac, sensorMac,) // recupero senza startDate e endDate
        await measurementController.getOutlierMeasurementsBySensor(networkCode,gatewayMac, sensorMac, "2025-05-29T10:00:00Z", "2025-05-29T13:00:00Z"); //Recupero con startDate e endDate definiti

        const foundWODate = await repo.getMeasurementsBySensor(networkCode, gatewayMac, sensorMac);
        const foundWithDate = await repo.getMeasurementsBySensor(networkCode, gatewayMac, sensorMac, "2025-05-29T10:00:00Z", "2025-05-29T13:00:00Z")
        
        const expectedfound = [
        {
            createdAt: new Date("2025-05-29T10:00:00Z").toUTCString(),
            value: 1
        },
        {
            createdAt: new Date("2025-05-29T11:00:00Z").toUTCString(),
            value: 2
        },
        {
            createdAt: new Date("2025-05-29T11:20:00Z").toUTCString(),
            value: 1
        },
        {
            createdAt: new Date("2025-05-29T11:30:00Z").toUTCString(),
            value: 2
        },
        {
            createdAt: new Date("2025-05-29T11:40:00Z").toUTCString(),
            value: 3
        },
        {
            createdAt: new Date("2025-05-29T12:00:00Z").toUTCString(),
            value: 50
        }] ;

         
        let i =  0;
        for (const m of foundWODate){
            expect(m).toMatchObject(expectedfound[i]);
            i++;
        }
        
        i = 0;
        for (const m of foundWithDate){
            expect(m).toMatchObject(expectedfound[i]);
            i++;
        }
        
        const values = [1,2,1,2,3,50];
        const foundStats = Mapper.calculateStats( values, new Date("2025-05-29T10:00:00Z"), new Date("2025-05-29T13:00:00Z"));
        const expectedStats : StatsDTO = {
            startDate: new Date("2025-05-29T10:00:00Z"),
            endDate: new Date("2025-05-29T13:00:00Z"),
            mean: 9.83,
            variance: 323.13888888888886,
            lowerThreshold: -26.11879533181743,
            upperThreshold: 45.7854619984841
            }
            
        expect(foundStats.startDate).toStrictEqual(expectedStats.startDate);
        expect(foundStats.endDate).toStrictEqual(expectedStats.endDate);
        expect(foundStats.mean).toBeCloseTo(expectedStats.mean);
        expect(foundStats.variance).toBeCloseTo(expectedStats.variance);
        expect(foundStats.lowerThreshold).toBeCloseTo(expectedStats.lowerThreshold);
        expect(foundStats.upperThreshold).toBeCloseTo(expectedStats.upperThreshold);

        const foundOutliers = Mapper.getOutliers(foundWithDate, foundStats);

        const expectedOutliers = [
        {
            createdAt: new Date("2025-05-29T12:00:00Z").toUTCString(),
            value: 50,
            isOutlier : true
        }];

        expect(foundOutliers).toMatchObject(expectedOutliers);
        expect(foundOutliers[0].createdAt).toBe(expectedOutliers[0].createdAt);
        expect(foundOutliers[0].value).toBe(expectedOutliers[0].value);
        expect(foundOutliers[0].isOutlier).toBe(expectedOutliers[0].isOutlier);
    
    });

    it("Get Stats for a specific Sensor", async() =>{
        await repo.createMeasurement("NET01", "GATE01", "SENS01", "2025-05-29T10:00:00Z", 10);
        await repo.createMeasurement("NET01", "GATE01", "SENS01", "2025-05-29T11:00:00Z", 15);
        await repo.createMeasurement("NET01", "GATE01", "SENS01", "2025-05-29T11:30:00Z", 20);

        const foundStats = await measurementController.getStatsBySensor(networkCode, gatewayMac, sensorMac,"2025-05-29T10:00:00Z", "2025-05-29T11:30:00Z" )
        const expectedStats = {
            startDate: new Date("2025-05-29T10:00:00Z"),
            endDate: new Date("2025-05-29T11:30:00Z"),
            mean: 15,
            variance: 16.666666666666668,
            lowerThreshold: 6.835034190722739,
            upperThreshold: 23.164965809277263
        }

        expect(foundStats).toMatchObject(expectedStats);
        expect(foundStats.startDate).toStrictEqual(expectedStats.startDate);
        expect(foundStats.endDate).toStrictEqual(expectedStats.endDate);
        expect(foundStats.mean).toBeCloseTo(expectedStats.mean);
        expect(foundStats.variance).toBeCloseTo(expectedStats.variance);
        expect(foundStats.lowerThreshold).toBeCloseTo(expectedStats.lowerThreshold);
        expect(foundStats.upperThreshold).toBeCloseTo(expectedStats.upperThreshold);
    })

    it("get Measurements for a specific Network", async() =>{
        await repo.createMeasurement("NET01", "GATE01", "SENS01", "2025-05-29T10:00:00Z", 10);
        await repo.createMeasurement("NET01", "GATE01", "SENS01", "2025-05-29T11:00:00Z", 15);
        await repo.createMeasurement("NET01", "GATE01", "SENS01", "2025-05-29T11:30:00Z", 20);
        await repo.createMeasurement("NET01", "GATE02", "SENS02", "2025-05-29T10:00:00Z", 10);
        await repo.createMeasurement("NET01", "GATE02", "SENS02", "2025-05-29T11:00:00Z", 15);
        await repo.createMeasurement("NET01", "GATE02", "SENS02", "2025-05-29T11:30:00Z", 20);

        const foundMeasurements : MeasurementsDTO[] = await measurementController.getMeasurementsByNetwork(networkCode, ["SENS01", "SENS02"]);
        const expectedMeasurements : MeasurementsDTO[] = [
        {
            sensorMacAddress: "SENS01",
            stats: {
            startDate: new Date("2025-05-29T10:00:00Z"),
            endDate: new Date("2025-05-29T11:30:00Z"),
            mean: 15,
            variance: 16.666666666666668,
            lowerThreshold: 6.835034190722739,
            upperThreshold: 23.164965809277263
            },
            measurements: [
            {
                "createdAt": new Date("2025-05-29T10:00:00Z"),
                "value": 10,
                "isOutlier": false
            },
            {
                "createdAt": new Date("2025-05-29T11:00:00Z"),
                "value": 15,
                "isOutlier": false
            },
            {
                "createdAt": new Date("2025-05-29T11:30:00Z"),
                "value": 20,
                "isOutlier": false
            }
            ]
        },
        {
            sensorMacAddress: "SENS02",
            stats: {
            startDate: new Date("2025-05-29T10:00:00Z"),
            endDate: new Date("2025-05-29T11:30:00Z"),
            mean: 15,
            variance: 16.666666666666668,
            lowerThreshold: 6.835034190722739,
            upperThreshold: 23.164965809277263
            },
            measurements: [
            {
                "createdAt": new Date("2025-05-29T10:00:00Z"),
                "value": 10,
                "isOutlier": false
            },
            {
                "createdAt": new Date("2025-05-29T11:00:00Z"),
                "value": 15,
                "isOutlier": false
            },
            {
                "createdAt": new Date("2025-05-29T11:30:00Z"),
                "value": 20,
                "isOutlier": false
            }
            ]
        } 
        ] 

        let i = 0;
        for (const m of foundMeasurements) {

        expect(m.sensorMacAddress).toBe(expectedMeasurements[i].sensorMacAddress);
        expect(new Date(m.stats.startDate)).toEqual(expectedMeasurements[i].stats.startDate);
        expect(new Date(m.stats.endDate)).toEqual(expectedMeasurements[i].stats.endDate);
        expect(m.stats.mean).toBeCloseTo(expectedMeasurements[i].stats.mean, 2);
        expect(m.stats.variance).toBeCloseTo(expectedMeasurements[i].stats.variance, 2);
        expect(m.stats.lowerThreshold).toBeCloseTo(expectedMeasurements[i].stats.lowerThreshold, 2);
        expect(m.stats.upperThreshold).toBeCloseTo(expectedMeasurements[i].stats.upperThreshold, 2);
        expect(m.measurements).toHaveLength(expectedMeasurements[i].measurements.length);
        i++;
        }  
        
        i = 0;
        let j = 0;
        for (const m of foundMeasurements) {
            for (let j  =0; j<2; j++){
                expect(new Date(foundMeasurements[i].measurements[j].createdAt).toISOString()).toStrictEqual(new Date(expectedMeasurements[i].measurements[j].createdAt).toISOString());
                expect(foundMeasurements[i].measurements[j].value).toBe(expectedMeasurements[i].measurements[j].value);
                expect(foundMeasurements[i].measurements[j].isOutlier).toBe(expectedMeasurements[i].measurements[j].isOutlier);
            }
            
        }
        
        const foundNoSensorMacs = await measurementController.getMeasurementsByNetwork(networkCode);
        i = 0;
        for (const m of foundNoSensorMacs) {

        expect(m.sensorMacAddress).toBe(expectedMeasurements[i].sensorMacAddress);
        expect(new Date(m.stats.startDate)).toEqual(expectedMeasurements[i].stats.startDate);
        expect(new Date(m.stats.endDate)).toEqual(expectedMeasurements[i].stats.endDate);
        expect(m.stats.mean).toBeCloseTo(expectedMeasurements[i].stats.mean, 2);
        expect(m.stats.variance).toBeCloseTo(expectedMeasurements[i].stats.variance, 2);
        expect(m.stats.lowerThreshold).toBeCloseTo(expectedMeasurements[i].stats.lowerThreshold, 2);
        expect(m.stats.upperThreshold).toBeCloseTo(expectedMeasurements[i].stats.upperThreshold, 2);
        expect(m.measurements).toHaveLength(expectedMeasurements[i].measurements.length);
        i++;
        }

        const found_WithMacString = await measurementController.getMeasurementsByNetwork(networkCode, "SENS01,SENS02");
        i = 0;
        for (const m of found_WithMacString) {
            
            expect(m.sensorMacAddress).toBe(expectedMeasurements[i].sensorMacAddress);
            expect(new Date(m.stats.startDate)).toEqual(expectedMeasurements[i].stats.startDate);
            expect(new Date(m.stats.endDate)).toEqual(expectedMeasurements[i].stats.endDate);
            expect(m.stats.mean).toBeCloseTo(expectedMeasurements[i].stats.mean, 2);
            expect(m.stats.variance).toBeCloseTo(expectedMeasurements[i].stats.variance, 2);
            expect(m.stats.lowerThreshold).toBeCloseTo(expectedMeasurements[i].stats.lowerThreshold, 2);
            expect(m.stats.upperThreshold).toBeCloseTo(expectedMeasurements[i].stats.upperThreshold, 2);
            expect(m.measurements).toHaveLength(expectedMeasurements[i].measurements.length);
            i++;
        }
        
    });

    it("Get Outliers for a specific Network", async () =>{
        await repo.createMeasurement("NET01", "GATE01", "SENS01", "2025-05-29T10:00:00Z", 1);
        await repo.createMeasurement("NET01", "GATE01", "SENS01", "2025-05-29T11:00:00Z", 2);
        await repo.createMeasurement("NET01", "GATE01", "SENS01", "2025-05-29T11:20:00Z", 1);
        await repo.createMeasurement("NET01", "GATE01", "SENS01", "2025-05-29T11:30:00Z", 2);
        await repo.createMeasurement("NET01", "GATE01", "SENS01", "2025-05-29T11:40:00Z", 3);
        await repo.createMeasurement("NET01", "GATE01", "SENS01", "2025-05-29T12:00:00Z", 50);
        await repo.createMeasurement("NET01", "GATE02", "SENS02", "2025-05-29T10:00:00Z", 1);
        await repo.createMeasurement("NET01", "GATE02", "SENS02", "2025-05-29T11:00:00Z", 2);
        await repo.createMeasurement("NET01", "GATE02", "SENS02", "2025-05-29T11:20:00Z", 1);
        await repo.createMeasurement("NET01", "GATE02", "SENS02", "2025-05-29T11:30:00Z", 2);
        await repo.createMeasurement("NET01", "GATE02", "SENS02", "2025-05-29T11:40:00Z", 3);
        await repo.createMeasurement("NET01", "GATE02", "SENS02", "2025-05-29T12:00:00Z", 50);

        const foundOutliers : MeasurementsDTO[] = await measurementController.getOutlierByNetwork(networkCode, ["SENS01","SENS02"]);
        const foundNoSensorMacs = await measurementController.getOutlierByNetwork(networkCode);

        const expectedMeasurements : MeasurementsDTO[] = [
        {
            sensorMacAddress: "SENS01",
            stats: {
                startDate: new Date("2025-05-29T10:00:00Z"),
                endDate: new Date("2025-05-29T12:00:00Z"),
                mean: 9.83,
                variance: 323.13888888888886,
                lowerThreshold: -26.11879533181743,
                upperThreshold: 45.7854619984841
            },
            measurements: [
                {
                    createdAt: new Date("2025-05-29T12:00:00Z"),
                    value: 50,
                    isOutlier: true
                }
            ]
        },
        {
            sensorMacAddress: "SENS02",
            stats: {
                startDate: new Date("2025-05-29T10:00:00Z"),
                endDate: new Date("2025-05-29T11:30:00Z"),
                mean: 9.83,
                variance: 323.13888888888886,
                lowerThreshold: -26.11879533181743,
                upperThreshold: 45.7854619984841
            },
            measurements: [
                {
                    createdAt: new Date("2025-05-29T12:00:00Z"),
                    value: 50,
                    isOutlier: true
                }
            ]}
        ]; 

        for (let outlier of foundOutliers){
            expect(outlier.measurements).toHaveLength(expectedMeasurements[0].measurements.length);
            expect(outlier.measurements).toHaveLength(expectedMeasurements[1].measurements.length);
        }
        
        for (let outlier of foundNoSensorMacs){
            expect(outlier.measurements).toHaveLength(expectedMeasurements[0].measurements.length);
            expect(outlier.measurements).toHaveLength(expectedMeasurements[1].measurements.length);
        }

    })

    it("Get Stats for a Specific Network", async () =>{
        await repo.createMeasurement("NET01", "GATE01", "SENS01", "2025-05-29T10:00:00Z", 10);
        await repo.createMeasurement("NET01", "GATE01", "SENS01", "2025-05-29T11:00:00Z", 15);
        await repo.createMeasurement("NET01", "GATE01", "SENS01", "2025-05-29T11:30:00Z", 20);
        await repo.createMeasurement("NET01", "GATE02", "SENS02", "2025-05-29T10:00:00Z", 10);
        await repo.createMeasurement("NET01", "GATE02", "SENS02", "2025-05-29T11:00:00Z", 15);
        await repo.createMeasurement("NET01", "GATE02", "SENS02", "2025-05-29T11:30:00Z", 20);

        const foundStats = await measurementController.getStatsByNetwork(networkCode, ["SENS01", "SENS02"],"2025-05-29T10:00:00Z", "2025-05-29T11:30:00Z" );
        const expectedStats = [
        {
            sensorMacAddress: "SENS01",
            stats: {
            startDate: new Date("2025-05-29T10:00:00.000Z"),
            endDate: new Date("2025-05-29T11:30:00.000Z"),
            mean: 15,
            variance: 16.666666666666668,
            lowerThreshold: 6.835034190722739,
            upperThreshold: 23.164965809277263
            }
        },
        {
            sensorMacAddress: "SENS02",
            stats: {
            startDate: new Date("2025-05-29T10:00:00.000Z"),
            endDate: new Date("2025-05-29T11:30:00.000Z"),
            mean: 15,
            variance: 16.666666666666668,
            lowerThreshold: 6.835034190722739,
            upperThreshold: 23.164965809277263
            
            }
        }
        ]
        let i=0;
        expect(foundStats).toMatchObject(expectedStats);
        for(const s of foundStats){
            expect(s.sensorMacAddress).toMatch(expectedStats[i].sensorMacAddress );
            expect(s.stats.startDate).toStrictEqual(expectedStats[i].stats.startDate);
            expect(s.stats.endDate).toStrictEqual(expectedStats[i].stats.endDate);
            expect(s.stats.mean).toBeCloseTo(expectedStats[i].stats.mean);
            expect(s.stats.variance).toBeCloseTo(expectedStats[i].stats.variance);
            expect(s.stats.upperThreshold).toBeCloseTo(expectedStats[i].stats.upperThreshold);
            expect(s.stats.lowerThreshold).toBeCloseTo(expectedStats[i].stats.lowerThreshold);
           i++;
        }
        
        const foundNoSensorMacs = await measurementController.getStatsByNetwork(networkCode);

        i=0;
        expect(foundStats).toMatchObject(expectedStats);
        for(const s of foundNoSensorMacs){          
            expect(s.sensorMacAddress).toMatch(expectedStats[i].sensorMacAddress );
            expect(s.stats.startDate).toStrictEqual(expectedStats[i].stats.startDate);
            expect(s.stats.endDate).toStrictEqual(expectedStats[i].stats.endDate);
            expect(s.stats.mean).toBeCloseTo(expectedStats[i].stats.mean);
            expect(s.stats.variance).toBeCloseTo(expectedStats[i].stats.variance);
            expect(s.stats.upperThreshold).toBeCloseTo(expectedStats[i].stats.upperThreshold);
            expect(s.stats.lowerThreshold).toBeCloseTo(expectedStats[i].stats.lowerThreshold);
           i++;
        }
        
    })

})