import request from "supertest";
import { app } from "@app";
import * as measurementController from "@controllers/measurementController";
import * as mapperServices from "@services/mapperService";
import { Measurement as MeasurementDTO } from "@models/dto/Measurement";
import { instanceOfMeasurements, Measurements as MeasurementsDTO } from "@models/dto/Measurements";
import { Stats as StatsDTO } from "@models/dto/Stats";
import { UserType } from "@models/UserType";
import * as authService from "@services/authService";
import { UnauthorizedError } from "@models/errors/UnauthorizedError";
import { InsufficientRightsError } from "@models/errors/InsufficientRightsError";
import { NotFoundError } from "@models/errors/NotFoundError";
import { CONFIG } from "@config";
import { MeasurementDAO } from "@models/dao/MeasurementDAO";
import { date } from "express-openapi-validator/dist/framework/base.serdes";
import { SensorDAO } from "@dao/SensorDAO";
import { GatewayDAO } from "@dao/GatewayDAO";
import { NetworkDAO } from "@dao/NetworkDAO";
import { NetworkRepository } from "@repositories/NetworkRepository";
import { GatewayRepository } from "@repositories/GatewayRepository";
import {
  initializeTestDataSource,
  closeTestDataSource,
  TestDataSource
} from "@test/setup/test-datasource";
import { SensorRepository } from "@repositories/SensorRepository";
import { MeasurementRepository } from "@repositories/MeasurementRepository";
import { Any } from "typeorm";

jest.mock("@services/mapperService");
jest.mock("@controllers/measurementController");
jest.mock("@services/authService");


describe("MeasurementRoutes integration ", () => {
    
    const token = "Bearer faketoken";
    const networkCode = "NET01";
    const gatewayMac = "GATE01";
    const sensorMac = "SENS01";
    
    beforeAll(async () => {
    await initializeTestDataSource();
    });
    
    afterEach(() => {
        jest.clearAllMocks();
    });
    beforeEach(async () =>{
        await TestDataSource.getRepository(MeasurementDAO).clear();
        await TestDataSource.getRepository(SensorDAO).clear();
        await TestDataSource.getRepository(GatewayDAO).clear();
        await TestDataSource.getRepository(NetworkDAO).clear();
    
    })

    it("Store measurements array (201 Created) )", async () => {
        (authService.processToken as jest.Mock).mockResolvedValue({
        username: "admin",
        type: UserType.Admin
        });
        const route = `/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`;
        (measurementController.createMeasurement as jest.Mock)
            .mockResolvedValueOnce({
                createdAt: "2025-01-01T15:00:00.000Z",
                value: 42.5,
            })
            .mockResolvedValueOnce({
                createdAt: "2025-01-01T16:00:00.000Z",
                value: 33.4,
            });
        
            const response = await request(app)
            .post(route)
            .set("Authorization", token)
            .send([{networkCode, gatewayMac, sensorMac ,createdAt: new Date("2025-01-01T15:00:00.000Z").toISOString(), value: 42.5},
                    {networkCode, gatewayMac, sensorMac ,createdAt: new Date("2025-01-01T16:00:00.000Z").toISOString() , value: 33.4}]);
            
            expect(response.status).toBe(201);
            expect(measurementController.createMeasurement).toHaveBeenNthCalledWith(
                1,
                networkCode,
                gatewayMac,
                sensorMac,
                expect.objectContaining({
                    createdAt: new Date("2025-01-01T15:00:00.000Z"),
                    value: 42.5,
                })
            );

            expect(measurementController.createMeasurement).toHaveBeenNthCalledWith(
                2,
                networkCode,
                gatewayMac,
                sensorMac,
                expect.objectContaining({
                    createdAt: new Date("2025-01-01T16:00:00.000Z"),
                    value: 33.4,
                })
            );
        
        
        expect(authService.processToken).toHaveBeenCalledWith(token, [
        UserType.Admin,
        UserType.Operator
        ]);

    });

    it("Store a single measurement (201 Created) )", async () => {
        (authService.processToken as jest.Mock).mockResolvedValue({
        username: "admin",
        type: UserType.Admin
        });
        const route = `/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`;
        
            const response = await request(app)
            .post(route)
            .set("Authorization", token)
            .send([{ 
                "createdAt": "2025-02-18T17:00:00+01:00",
                "value": 1.8567
            }])
            
            expect(response.status).toBe(201);

        expect(authService.processToken).toHaveBeenCalledWith(token, [
        UserType.Admin,
        UserType.Operator
        ]);

    });

    it("Return 401 if unauthorized", async () => {
        (authService.processToken as jest.Mock).mockImplementation(() => {
              throw new UnauthorizedError("Unauthorized: No token provided");
        });
            const route = `/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`;
            const response = await request(app)
            .post(route)
            .set("Authorization", "Bearer invalid")
            .send([{networkCode, gatewayMac, sensorMac ,createdAt: "2025-01-01T15:00:00.000Z", value: 42.5},
                    {networkCode, gatewayMac, sensorMac ,createdAt: "2025-01-01T16:00:00.000Z", value: 33.4}]);

            expect(response.status).toBe(401);
            expect(response.body.message).toMatch(/Unauthorized/);
    });

    it("Return 403 if user lacks rights", async () => {
        (authService.processToken as jest.Mock).mockImplementation(() => {
        throw new InsufficientRightsError("Insufficient rights");
        });
        const route = `/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`;
        const response = await request(app)
        .post(route)
        .set("Authorization", token)
        .send([{networkCode, gatewayMac, sensorMac ,createdAt: "2025-01-01T15:00:00.000Z", value: 42.5},
                {networkCode, gatewayMac, sensorMac ,createdAt: "2025-01-01T16:00:00.000Z", value: 33.4}]);

        expect(response.status).toBe(403);
        expect(response.body.message).toMatch(/Insufficient rights/);
        
            
    });

    it("Create measurement:  (404 network/gateway/sensor not found", async () => {
        (authService.processToken as jest.Mock).mockResolvedValue({
            username: "admin",
            type: UserType.Admin
        });
        const route = `/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`;
        (measurementController.createMeasurement as jest.Mock).mockImplementation(() => {
            throw new NotFoundError("Network/Gateway/Sensor not found");
        });

        const response = await request(app)
        .post(route)
        .set("Authorization", token)
        .send([{networkCode, gatewayMac, sensorMac ,createdAt: "2025-01-01T15:00:00.000Z", value: 42.5},
                {networkCode, gatewayMac, sensorMac ,createdAt: "2025-01-01T16:00:00.000Z", value: 33.4}]);
        expect(response.status).toBe(404);
        expect(response.body.message).toMatch(/Sensor not found/);        
    });

    //  GET MEASUREMENT BY SENSOR
    it('Get measurements for a specific sensor: (200 OK)', async () => {
        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        const route = `/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`;
        const startDate = new Date("2025-01-01T15:00:00.000Z").toISOString();
        const endDate = new Date("2025-01-01T17:00:00.000Z").toISOString();
        (measurementController.getMeasurementsBySensor as jest.Mock).mockResolvedValue({
            sensorMacAddress: "SENS01",
            stats: {
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            mean: 14,
            variance: 30,
            upperThreshold: 15,
            lowerThreshold: 13
        } as StatsDTO, 
        measurements: [{createdAt: new Date("2025-01-01T15:00:00.000Z"), value: 13, isOutlier: false} as MeasurementDTO,{createdAt: new Date("2025-01-01T15:20:00.000Z"), value: 15, isOutlier: false } as MeasurementDTO]
        } as MeasurementsDTO);
        
        const response = await request(app)
        .get(route)
        .set("Authorization" , token)

        expect(response.status).toBe(200);
        expect(instanceOfMeasurements(response.body)).toBe(true);
        expect(measurementController.getMeasurementsBySensor).toHaveBeenCalled();
        expect(response.body.sensorMacAddress).toBe("SENS01");
        expect(Array.isArray(response.body.measurements)).toBe(true);
        if (response.body.stats) {
            expect(response.body.stats).toHaveProperty('mean');
            expect(response.body.stats).toHaveProperty('variance');
            expect(response.body.stats).toHaveProperty('upperThreshold');
            expect(response.body.stats).toHaveProperty('lowerThreshold');
        }

    if (response.body.measurements && response.body.measurements.length > 0) {
      for (const m of response.body.measurements) {
        expect(new Date(m.createdAt).toUTCString()).not.toBe('Invalid Date');
        expect(typeof m.value).toBe('number');
      }
    }
    });

    it("Get measurements for a specific sensor: (400 Invalid input data)", async () => {
        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        const invalidStartDate = "2025-04-09";
        const route = `/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements?startDate=${invalidStartDate}`;

        const response = await request(app)
        .get(route)
        .set("Authorization" , token)

        expect(response.status).toBe(400);

    });

    it("Get measurements for a specific sensor: (401 Unauthorized)", async () => {
        const route = `/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`;
        (authService.processToken as jest.Mock).mockImplementation(() => {
              throw new UnauthorizedError("Unauthorized: No token provided");
            });
        
            const response = await request(app)
              .get(route)
              .set("Authorization", "Bearer invalid");
        
            expect(response.status).toBe(401);
            expect(response.body.message).toMatch(/Unauthorized/);
    });

    it("Get measurements for a specific sensor: (404 Not found Error)", async () =>{
        const route = `/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/Sens02/measurements`;
        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        (measurementController.getMeasurementsBySensor as jest.Mock).mockImplementation(() => {
            throw new NotFoundError("Network/Gateway/Sensor not found");
        });

        const response = await request(app)
        .get(route)
        .set("Authorization", token)
        expect(response.status).toBe(404);
        expect(response.body.message).toBe("Network/Gateway/Sensor not found");
    });

    it("Get measurements for a specific sensor: (500 Internal server error)", async () => {
        const route = `/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`;
        (authService.processToken as jest.Mock).mockResolvedValue(undefined);

        (measurementController.getMeasurementsBySensor as jest.Mock).mockImplementation(() => {
            throw new Error("Internal server error");
        });

        const response = await request(app)
        .get(route)
        .set("Authorization", token);

        expect(response.status).toBe(500);
    });

    //GET STATISTICS BY SENSOR
    it("Get statistic for a specific sensor", async () => {
        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        const route = `/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/stats`;
        const startDate = new Date("2025-01-01T15:00:00.000Z").toISOString();
        const endDate = new Date("2025-01-01T17:00:00.000Z").toISOString();
        (measurementController.getStatsBySensor as jest.Mock).mockResolvedValue({
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            mean: 14,
            variance: 30,
            upperThreshold: 15,
            lowerThreshold: 13
        } as StatsDTO)
        
        const response = await request(app)
        .get(route)
        .set("Authorization" , token)

        expect(response.status).toBe(200);
        expect(measurementController.getStatsBySensor).toHaveBeenCalled();
        expect(response.body.startDate).toMatch("2025-01-01T15:00:00.000Z");
        expect(response.body.endDate).toMatch("2025-01-01T17:00:00.000Z");
        expect(response.body.mean).toBeDefined()
        expect(response.body.variance).toBeDefined()
        expect(response.body.lowerThreshold).toBeDefined();
        expect(response.body.upperThreshold).toBeDefined();
    });

    it("Get Stats for a specific sensor: (400 Invalid input data)", async () => {
        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        const invalidStartDate = "2025-04-09";
        const route = `/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements?startDate=${invalidStartDate}`;
        const response = await request(app)
        .get(route)
        .set("Authorization" , token)

        expect(response.status).toBe(400);
    });

    it("Get Stats for a specific sensor: (401 Unauthorized)", async () => {
        const route = `/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/stats`;
        (authService.processToken as jest.Mock).mockImplementation(() => {
              throw new UnauthorizedError("Unauthorized: No token provided");
            });
        
            const response = await request(app)
              .get(route)
              .set("Authorization", "Bearer invalid");
        
            expect(response.status).toBe(401);
            expect(response.body.message).toMatch(/Unauthorized/);
    });

    it("Get Stats for a specific sensor: (404 Not found Error)", async () =>{
        const route = `/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/stats`;
        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        (measurementController.getStatsBySensor as jest.Mock).mockImplementation(() => {
            throw new NotFoundError("Network/Gateway/Sensor not found");
        });

        const response = await request(app)
        .get(route)
        .set("Authorization", token)
        expect(response.status).toBe(404);
        expect(response.body.message).toBe("Network with id 'NET01' not found");
    });

    it("Get Stats for a specific sensor: (500 Internal server error)", async () => {
        const route = `/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/stats`;
        (authService.processToken as jest.Mock).mockResolvedValue(undefined);

        (measurementController.getStatsBySensor as jest.Mock).mockImplementation(() => {
            throw new Error("Internal server error");
        });
        const response = await request(app)
        .get(route)
        .set("Authorization", token);

        expect(response.status).toBe(500);
    });

    //GET OUTLIERS BY SENSOR
    it("Get outliers for a specific sensor", async () => {
        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        const route = `/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/outliers`;
        const startDate = new Date("2025-01-01T15:00:00.000Z").toISOString();
        const endDate = new Date("2025-01-01T17:00:00.000Z").toISOString();

        (measurementController.getOutlierMeasurementsBySensor as jest.Mock).mockResolvedValue(
            {
                sensorMacAddress: "SENS01",
                stats: {
                    startDate: new Date(startDate),
                    endDate: new Date(endDate),
                    mean: 14,
                    variance: 30,
                    upperThreshold: 15,
                    lowerThreshold: 13
                } as StatsDTO,
                measurements: [{createdAt: new Date("2025-01-01T15:00:00.000Z"), value: 2, isOutlier: true} as MeasurementDTO,{createdAt: new Date("2025-01-01T15:20:00.000Z"), value: 66, isOutlier: true } as MeasurementDTO]
            } as MeasurementsDTO)

            const response = await request(app)
            .get(route)
            .set("Authorization" , token)

            expect(response.status).toBe(200);
            expect(measurementController.getOutlierMeasurementsBySensor).toHaveBeenCalled();
            expect(response.body.sensorMacAddress).toBe("SENS01");
            expect(response.body.stats.startDate).toBe("2025-01-01T15:00:00.000Z");
            expect(response.body.stats.endDate).toBe("2025-01-01T17:00:00.000Z");
            expect(response.body.stats.mean).toBeDefined()
            expect(response.body.stats.variance).toBeDefined()
            expect(response.body.stats.lowerThreshold).toBeDefined();
            expect(response.body.stats.upperThreshold).toBeDefined();
            for (const m of response.body.measurements){
                expect(m.isOutlier).toBe(true);
            }
            expect(response.body.measurements[0].value).toBeLessThan(response.body.stats.lowerThreshold);
            expect(response.body.measurements[1].value).toBeGreaterThan(response.body.stats.upperThreshold);
    });

    it("Get Outliers for a specific sensor: (400 Invalid input data)", async () => {
        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        const invalidStartDate = "2025-04-09";
        const route = `/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/outliers?startDate=${invalidStartDate}`;
        const response = await request(app)
        .get(route)
        .set("Authorization" , token)

        expect(response.status).toBe(400);
    });

    it("Get Outliers for a specific sensor: (401 Unauthorized)", async () => {
        const route = `/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/outliers`;
        (authService.processToken as jest.Mock).mockImplementation(() => {
              throw new UnauthorizedError("Unauthorized: No token provided");
            });
        
            const response = await request(app)
              .get(route)
              .set("Authorization", "Bearer invalid");
        
            expect(response.status).toBe(401);
            expect(response.body.message).toMatch(/Unauthorized/);
    });

    it("Get Outliers for a specific sensor: (404 Not found Error)", async () =>{
        const route = `/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/outliers`;
        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        (measurementController.getOutlierMeasurementsBySensor as jest.Mock).mockImplementation(() => {
            throw new NotFoundError("Network/Gateway/Sensor not found");
        });

        const response = await request(app)
        .get(route)
        .set("Authorization", token)
        expect(response.status).toBe(404);
        expect(response.body.message).toBe("Network with id 'NET01' not found");
    });

    it("Get Outliers for a specific sensor: (500 Internal server error)", async() => {
        const route = `/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/outliers`;
        (authService.processToken as jest.Mock).mockResolvedValue(undefined);

        (measurementController.getOutlierMeasurementsBySensor as jest.Mock).mockImplementation(() => {
            throw new Error("Internal server error");
        });
        const response = await request(app)
        .get(route)
        .set("Authorization", token);

        expect(response.status).toBe(500);
    });
    
    //GET MEASUREMENTS BY NETWORK
    it("Get measurements for a specific Network: (200 OK)", async () => {
        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        const route = `/api/v1/networks/${networkCode}/measurements`;
        const startDate = new Date("2025-01-01T15:00:00.000Z");
        const endDate = new Date("2025-01-01T17:00:00.000Z");
        (measurementController.getMeasurementsByNetwork as jest.Mock).mockResolvedValue([
            {
                sensorMacAddress: "71:B1:CE:01:C6:A9",
                stats: {
                startDate: startDate,
                endDate: endDate,
                mean: 23.45,
                variance: 7.56,
                upperThreshold: 28.95,
                lowerThreshold: 17.95,
                },
                measurements: [
                {
                    createdAt: new Date("2025-02-18T16:00:00Z"),
                    value: 21.8567,
                    isOutlier: false,
                }
                ]
            },
            {
                sensorMacAddress: "82:C3:FD:12:D9:B8",
                stats: {
                startDate: startDate,
                endDate: endDate,
                mean: 18.22,
                variance: 4.11,
                upperThreshold: 22.5,
                lowerThreshold: 14.0,
                },
                measurements: [
                {
                    createdAt: new Date("2025-02-19T10:30:00Z"),
                    value: 17.9,
                    isOutlier: false,
                },
                {
                    createdAt: new Date( "2025-02-19T11:15:00Z"),
                    value: 19.8,
                    isOutlier: false,
                }
                ]
            }
            ] as MeasurementsDTO[]);

        const response = await request(app)
        .get(route)
        .set("Authorization" , token)

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        for (const measurementsDTO of response.body){ //ogni elemento del response.body e un measuementsDTO
            expect(instanceOfMeasurements(measurementsDTO)).toBe(true);
            expect(measurementController.getMeasurementsByNetwork).toHaveBeenCalled();
            expect(measurementsDTO).toHaveProperty("sensorMacAddress");
            if (response.body.stats) {
                expect(measurementsDTO.stats).toHaveProperty('mean');
                expect(measurementsDTO.stats).toHaveProperty('variance');
                expect(measurementsDTO.stats).toHaveProperty('upperThreshold');
                expect(measurementsDTO.stats).toHaveProperty('lowerThreshold');
            }
            if (response.body.measurements && response.body.measurements.length > 0) {
                for (const m of measurementsDTO.measurements) {
                    expect(new Date(m.createdAt).toUTCString()).not.toBe('Invalid Date');
                    expect(typeof m.value).toBe('number');
                }
            }
        }
    });

    it("Get measurements for a specific Network: (400 Invalid input data)", async () => {
        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        const invalidStartDate = "2025-04-09";
        const route = `/api/v1/networks/${networkCode}/measurements?startDate=${invalidStartDate}`;
        const response = await request(app)
        .get(route)
        .set("Authorization" , token)

        expect(response.status).toBe(400);

    });

    it("Get measurements for a specific Network: (401 Not Authorized)", async () =>{
        const route = `/api/v1/networks/measurements`;
        (authService.processToken as jest.Mock).mockImplementation(() => {
              throw new UnauthorizedError("Unauthorized: No token provided");
            });
        
            const response = await request(app)
              .get(route)
              .set("Authorization", "Bearer invalid");
        
            expect(response.status).toBe(401);
            expect(response.body.message).toMatch(/Unauthorized/);
    });

    it("Get measurements for a specific Network: (404 Not Found)", async () =>{
        const route = `/api/v1/networks/${networkCode}/measurements`;
        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        (measurementController.getMeasurementsByNetwork as jest.Mock).mockImplementation(() => {
            throw new NotFoundError("Network not found");
        });

        const response = await request(app)
        .get(route)
        .set("Authorization", token)
        expect(response.status).toBe(404);
        expect(response.body.message).toBe("Network not found");
    });

    it("Get measurements for a specific Network: (500 Internal server error)", async () =>{
        const route = `/api/v1/networks/${networkCode}/measurements`;
        (authService.processToken as jest.Mock).mockResolvedValue(undefined);

        (measurementController.getMeasurementsByNetwork as jest.Mock).mockImplementation(() => {
            throw new Error("Internal server error");
        });
        const response = await request(app)
        .get(route)
        .set("Authorization", token);

        expect(response.status).toBe(500);
    });
    //GET STATISTICS BY NETWORK
    it("Get Stats for a specific Network: (200 OK)", async () =>{
        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        const route = `/api/v1/networks/${networkCode}/stats`;
        const startDate = new Date("2025-01-01T15:00:00.000Z");
        const endDate = new Date("2025-01-01T17:00:00.000Z");

        (measurementController.getStatsByNetwork as jest.Mock).mockResolvedValue([
            {
                sensorMacAddress: "SENS01",
                stats: {
                startDate: startDate,
                endDate: endDate,
                mean: 23.45,
                variance: 7.56,
                upperThreshold: 28.95,
                lowerThreshold: 17.95,
                },
                measurements: []
            } as MeasurementsDTO,
            {
                sensorMacAddress: "SENS01",
                stats: {
                startDate: startDate,
                endDate: endDate,
                mean: 18.22,
                variance: 4.11,
                upperThreshold: 22.5,
                lowerThreshold: 14.0,
                },
                measurements: []
            } as MeasurementsDTO
            ] as MeasurementsDTO[]);

        const response = await request(app)
        .get(route)
        .set("Authorization" , token)

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        for(const measurementsDTO of response.body){
            expect(measurementsDTO.sensorMacAddress).toBeDefined();
            if (response.body.stats) {
                expect(measurementsDTO.stats).toHaveProperty('mean');
                expect(measurementsDTO.stats).toHaveProperty('variance');
                expect(measurementsDTO.stats).toHaveProperty('upperThreshold');
                expect(measurementsDTO.stats).toHaveProperty('lowerThreshold');
            }
            expect(measurementsDTO.measurements).toStrictEqual([]);
        
        }
    });

    it("Get Stats for a specific Network: (400 Invalid input data)", async() => {
        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        const invalidStartDate = "2025-04-09";
        const route = `/api/v1/networks/${networkCode}/stats?startDate=${invalidStartDate}`;
        const response = await request(app)
        .get(route)
        .set("Authorization" , token)

        expect(response.status).toBe(400);
    });

    it("Get Stats for a specific Network: (401 Not Authorized)", async() => {
        const route = `/api/v1/networks/${networkCode}/stats`;
        (authService.processToken as jest.Mock).mockImplementation(() => {
              throw new UnauthorizedError("Unauthorized: No token provided");
            });
        
            const response = await request(app)
              .get(route)
              .set("Authorization", "Bearer invalid");
        
            expect(response.status).toBe(401);
            expect(response.body.message).toMatch(/Unauthorized/);
    });

    it("Get stats for a specific Network: (404 Not Found)", async () =>{
        const route = `/api/v1/networks/${networkCode}/stats`;
        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        (measurementController.getStatsByNetwork as jest.Mock).mockImplementation(() => {
            throw new NotFoundError("Network not found");
        });

        const response = await request(app)
        .get(route)
        .set("Authorization", token)
        expect(response.status).toBe(404);
        expect(response.body.message).toBe("Network not found");
    })

    it("Get Stats for a specific Network: (500 Internal server error)", async() =>{
        const route = `/api/v1/networks/${networkCode}/stats`;
        (authService.processToken as jest.Mock).mockResolvedValue(undefined);

        (measurementController.getStatsByNetwork as jest.Mock).mockImplementation(() => {
            throw new Error("Internal server error");
        });
        const response = await request(app)
        .get(route)
        .set("Authorization", token);

        expect(response.status).toBe(500);
    })

    //GET OUTLIERS BY NETWORK
    it("Get Outliers for a specific Network: (200 OK)", async() => {
        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        const route = `/api/v1/networks/${networkCode}/outliers`;
        const startDate = new Date("2025-01-01T15:00:00.000Z");
        const endDate = new Date("2025-01-01T17:00:00.000Z");
        (measurementController.getOutlierByNetwork as jest.Mock).mockResolvedValue([
            {
                sensorMacAddress: "71:B1:CE:01:C6:A9",
                stats: {
                startDate: startDate,
                endDate: endDate,
                mean: 23.45,
                variance: 7.56,
                upperThreshold: 28.95,
                lowerThreshold: 17.95,
                },
                measurements: [
                {
                    createdAt: new Date("2025-02-18T16:00:00Z"),
                    value: 21.8567,
                    isOutlier: true,
                }
                ]
            },
            {
                sensorMacAddress: "82:C3:FD:12:D9:B8",
                stats: {
                startDate: startDate,
                endDate: endDate,
                mean: 18.22,
                variance: 4.11,
                upperThreshold: 22.5,
                lowerThreshold: 14.0,
                },
                measurements: [
                {
                    createdAt: new Date("2025-02-19T10:30:00Z"),
                    value: 17.9,
                    isOutlier: true,
                },
                {
                    createdAt: new Date( "2025-02-19T11:15:00Z"),
                    value: 19.8,
                    isOutlier: true,
                }
                ]
            }
            ] as MeasurementsDTO[]);

            const response = await request(app)
        .get(route)
        .set("Authorization" , token)

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        for (const measurementsDTO of response.body){ //ogni elemento del response.body e un measuementsDTO
            expect(instanceOfMeasurements(measurementsDTO)).toBe(true);
            expect(measurementController.getOutlierByNetwork).toHaveBeenCalled();
            expect(measurementsDTO).toHaveProperty("sensorMacAddress");
            if (response.body.stats) {
                expect(measurementsDTO.stats).toHaveProperty('mean');
                expect(measurementsDTO.stats).toHaveProperty('variance');
                expect(measurementsDTO.stats).toHaveProperty('upperThreshold');
                expect(measurementsDTO.stats).toHaveProperty('lowerThreshold');
            }
            if (response.body.measurements && response.body.measurements.length > 0) {
                for (const m of measurementsDTO.measurements) {
                    expect(new Date(m.createdAt).toUTCString()).not.toBe('Invalid Date');
                    expect(typeof m.value).toBe('number');
                    expect(m.isOutlier).toBe(true);
                }
            }
        }
    })

    it("Get Outliers for a specific Network: (400 Invalid input data )", async () =>{
        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        const invalidStartDate = "2025-04-09";
        const route = `/api/v1/networks/${networkCode}/outliers?startDate=${invalidStartDate}`;
        const response = await request(app)
        .get(route)
        .set("Authorization" , token)

        expect(response.status).toBe(400);
    });

    it("Get Outliers for a specific Network: (401 Not Authorized)", async () => {
        const route = `/api/v1/networks/${networkCode}/outliers`;
        (authService.processToken as jest.Mock).mockImplementation(() => {
              throw new UnauthorizedError("Unauthorized: No token provided");
            });
        
            const response = await request(app)
              .get(route)
              .set("Authorization", "Bearer invalid");
        
            expect(response.status).toBe(401);
            expect(response.body.message).toMatch(/Unauthorized/);
    });

    it("Get Outliers for a specific Network: (404 Not Found)", async () =>{
        const route = `/api/v1/networks/${networkCode}/outliers`;
        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        (measurementController.getOutlierByNetwork as jest.Mock).mockImplementation(() => {
            throw new NotFoundError("Network not found");
        });

        const response = await request(app)
        .get(route)
        .set("Authorization", token)
        expect(response.status).toBe(404);
        expect(response.body.message).toBe("Network not found");
    });

    it("Get Outliers for a specific Network: (500 Internal server error)", async () =>{
        const route = `/api/v1/networks/${networkCode}/outliers`;
        (authService.processToken as jest.Mock).mockResolvedValue(undefined);

        (measurementController.getOutlierByNetwork as jest.Mock).mockImplementation(() => {
            throw new Error("Internal server error");
        });
        const response = await request(app)
        .get(route)
        .set("Authorization", token);

        expect(response.status).toBe(500);
    });

    

})