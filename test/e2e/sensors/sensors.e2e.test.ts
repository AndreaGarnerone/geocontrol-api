import request from 'supertest';
import { app } from '@app';
import { beforeAllE2e, afterAllE2e, TEST_USERS } from '@test/e2e/lifecycle';
import { DataSource } from 'typeorm';
import { CONFIG } from '@config';
import { AppDataSource } from '@database';
import { UserRepository } from '@repositories/UserRepository';
import { NetworkRepository } from '@repositories/NetworkRepository';
import { SensorRepository } from '@repositories/SensorRepository';
import { generateToken } from '@services/authService';
import { GatewayRepository } from '@repositories/GatewayRepository';
import { InternalServerError } from 'express-openapi-validator/dist/openapi.validator';
import { createAppError } from '@services/errorService';

export const e2e_Datasource = new DataSource ({
    type: 'sqlite',
    database: ':memory:',
    synchronize: true,
    entities: CONFIG.DB_ENTITIES,
});

export async function initializeE2eDatabase(): Promise<void> {
    if (!e2e_Datasource.isInitialized) {
        await e2e_Datasource.initialize();
        Object.assign(AppDataSource, e2e_Datasource)
        return;
    }
}

let token: string;
let token2: string;
let token3: string;

beforeAll(async () => {
    await beforeAllE2e();
    await initializeE2eDatabase();
    token = generateToken(TEST_USERS.admin);
    token2 = generateToken(TEST_USERS.operator);
    token3 = generateToken(TEST_USERS.viewer);

    const userRepo = new UserRepository();
    await userRepo.createUser(TEST_USERS.admin.username, TEST_USERS.admin.password, TEST_USERS.admin.type);
    await userRepo.createUser(TEST_USERS.operator.username, TEST_USERS.operator.password, TEST_USERS.operator.type);
    await userRepo.createUser(TEST_USERS.viewer.username, TEST_USERS.viewer.password, TEST_USERS.viewer.type);

    const networkRepo = new NetworkRepository();
    await networkRepo.createNetwork("NET01", "Network 01", "Test Network 01");
    await networkRepo.createNetwork("NET02", "Network 02", "Test Network 02");
    await networkRepo.createNetwork("NET03", "Network 03", "Test Network 03");

    const gatewayRepo = new GatewayRepository();
    await gatewayRepo.createGateways("NET01", "GAT01", "gateway 01", "Test gateway 01");
    await gatewayRepo.createGateways("NET01", "GAT02", "gateway 02", "Test gateway 02");
    await gatewayRepo.createGateways("NET02", "GAT03", "gateway 03", "Test gateway 03");
    await gatewayRepo.createGateways("NET03", "GAT04", "gateway 04", "Test gateway 04");

    const sensorRepo = new SensorRepository();
    await sensorRepo.createSensor("NET01", "GAT01", "S1", "Sensor1", "Temperature sensor", "Temperature", "Celsius");
    await sensorRepo.createSensor("NET01", "GAT01", "S2", "Sensor2", "Humidity sensor", "Humidity", "Percentage");
    await sensorRepo.createSensor("NET02", "GAT03", "S3", "Sensor3", "Pressure sensor", "Pressure", "Pascal");
    await sensorRepo.createSensor("NET03", "GAT04", "S4", "Sensor4", "Light sensor", "Light", "Lux");
});

afterAll(async () => {
    await afterAllE2e();
    if (e2e_Datasource.isInitialized) {
        await e2e_Datasource.destroy();
    }
});

describe('E2E Sensors GET', () => {
    it('get all sensors', async () => {
        const res = await request(app)
            .get('/api/v1/networks/NET01/gateways/GAT01/sensors')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.length).toBe(2);
        const sensorMacs = res.body.map((s: any) => s.macAddress).sort();
        expect(sensorMacs).toEqual(["S1", "S2"]);
    });

    it('get all sensors: unauthorized', async () => {
        const res = await request(app)
            .get('/api/v1/networks/NET01/gateways/GAT01/sensors')
            .set('Authorization', `Bearer invalidtoken`);
        expect(res.status).toBe(401);
        expect(res.body.message).toMatch(/Unauthorized/);
    });

    it('get all sensors: unexisting network', async () => {
        const res = await request(app)
            .get('/api/v1/networks/NET99/gateways/GAT01/sensors')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(404);
        expect(res.body.message).toMatch(/Network with id 'NET99' not found/);
    });

    it('get all sensors: unexisting gateway', async () => {
        const res = await request(app)
            .get('/api/v1/networks/NET01/gateways/GAT99/sensors')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(404);
        expect(res.body.message).toMatch(/gateway with MAC address 'GAT99' not found/);
    });


    it('get sensor by mac address', async () => {
        const res = await request(app)
            .get('/api/v1/networks/NET02/gateways/GAT03/sensors/S3')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.macAddress).toBe("S3");
        expect(res.body.name).toBe("Sensor3");
        expect(res.body.variable).toBe("Pressure");
    });

    it('get sensor by mac address: not found', async () => {
        const res = await request(app)
            .get('/api/v1/networks/NET01/gateways/GAT01/sensors/S999')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(404);
        expect(res.body.message).toMatch(/Sensor with id 'S999' not found/);
    });

    it('get sensor by mac address: unauthorized', async () => {
        const res = await request(app)
            .get('/api/v1/networks/NET01/gateways/GAT01/sensors/S1')
            .set('Authorization', `Bearer invalidtoken`);
        expect(res.status).toBe(401);
        expect(res.body.message).toMatch(/Unauthorized/);
    });

    it('get sensor by mac address: unexisting network', async () => {
        const res = await request(app)
            .get('/api/v1/networks/NET99/gateways/GAT01/sensors/S1')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(404);
        expect(res.body.message).toMatch(/Network with id 'NET99' not found/);
    });

    it('get sensor by mac address: unexisting gateway', async () => {
        const res = await request(app)
            .get('/api/v1/networks/NET01/gateways/GAT99/sensors/S1')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(404);
        expect(res.body.message).toMatch(/gateway with MAC address 'GAT99' not found/);
    });
});

describe('E2E Sensors CREATE', () => {
    it('create sensor', async () => {
        const newSensor = {
            macAddress: "S5",
            name: "Sensor5",
            description: "New sensor",
            variable: "Current",
            unit: "Amperes"
        };
        const res = await request(app)
            .post('/api/v1/networks/NET03/gateways/GAT04/sensors')
            .set('Authorization', `Bearer ${token}`)
            .send(newSensor);
        expect(res.status).toBe(201);

        const res2 = await request(app)
            .get('/api/v1/networks/NET03/gateways/GAT04/sensors/S5')
            .set('Authorization', `Bearer ${token}`);
        expect(res2.status).toBe(200);
        expect(res2.body.macAddress).toBe("S5");
        expect(res2.body.name).toBe("Sensor5");
        expect(res2.body.variable).toBe("Current");
    });

    it('create sensor: already exists', async () => {
        const newSensor = {
            macAddress: "S5",
            name: "Sensor5",
            description: "New sensor",
            variable: "Current",
            unit: "Amperes"
        };
        const res = await request(app)
            .post('/api/v1/networks/NET03/gateways/GAT04/sensors')
            .set('Authorization', `Bearer ${token}`)
            .send(newSensor);
        expect(res.status).toBe(409);
        expect(res.body.message).toMatch(/Sensor with macAddress 'S5' already exists/);
    });

    it('create sensor: unauthorized', async () => {
        const newSensor = {
            macAddress: "S6",
            name: "Sensor6",
            description: "Unauthorized sensor",
            variable: "Voltage",
            unit: "Volts"
        };
        const res = await request(app)
            .post('/api/v1/networks/NET03/gateways/GAT04/sensors')
            .set('Authorization',  `Bearer invalid token`) 
            .send(newSensor);
        expect(res.status).toBe(401);
        expect(res.body.message).toMatch(/Unauthorized/);
    });

    it('create sensor: forbidden', async () => {
        const newSensor = {
            macAddress: "S7",
            name: "Sensor7",
            description: "Forbidden sensor",
            variable: "Voltage",
            unit: "Volts"
        };
        const res = await request(app)
            .post('/api/v1/networks/NET01/gateways/GAT01/sensors')
            .set('Authorization', `Bearer ${token3}`)
            .send(newSensor);
        expect(res.status).toBe(403);
        expect(res.body.message).toMatch(/Forbidden/);
    });

    it('create sensor: bad request without sensor mac address', async () => {
        const newSensor = {
            name: "Sensor8",
            description: "Bad request sensor",
            variable: "Voltage",
            unit: "Volts"
        };
        const res = await request(app)
            .post('/api/v1/networks/NET01/gateways/GAT01/sensors')
            .set('Authorization', `Bearer ${token}`)
            .send(newSensor);
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch("request/body must have required property 'macAddress'");
    });

    it('create sensor: bad request with invalid sensor mac address', async () => {
        const newSensor = {
            macAddress: 123, // Invalid type
            name: "Sensor9",
            description: "Invalid sensor mac address",
            variable: "Voltage",
            unit: "Volts"
        };
        const res = await request(app)
            .post('/api/v1/networks/NET01/gateways/GAT01/sensors')
            .set('Authorization', `Bearer ${token}`)
            .send(newSensor);
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch("request/body/macAddress must be string");
    });

    it('create sensor: unexisting network', async () => {
        const newSensor = {
            macAddress: "S8",
            name: "Sensor8",
            description: "Unexisting network sensor",
            variable: "Voltage",
            unit: "Volts"
        };
        const res = await request(app)
            .post('/api/v1/networks/NET99/gateways/GAT01/sensors')
            .set('Authorization', `Bearer ${token}`)
            .send(newSensor);
        expect(res.status).toBe(404);
        expect(res.body.message).toMatch(/Network with id 'NET99' not found/);
    });

    it('create sensor: unexisting gateway', async () => {
        const newSensor = {
            macAddress: "S9",
            name: "Sensor9",
            description: "Unexisting gateway sensor",
            variable: "Voltage",
            unit: "Volts"
        };
        const res = await request(app)
            .post('/api/v1/networks/NET01/gateways/GAT99/sensors')
            .set('Authorization', `Bearer ${token}`)
            .send(newSensor);
        expect(res.status).toBe(404);
        expect(res.body.message).toMatch(/gateway with MAC address 'GAT99' not found/);
    });

});

describe('E2E Sensors UPDATE', () => {
    it('update sensor', async () => {
        const updatedSensor = {
            macAddress: "S1",
            name: "Updated Sensor1",
            description: "Updated Temperature sensor",
            variable: "Temperature",
            unit: "Celsius"
        };
        const res = await request(app)
            .patch('/api/v1/networks/NET01/gateways/GAT01/sensors/S1')
            .set('Authorization', `Bearer ${token}`)
            .send(updatedSensor);
        expect(res.status).toBe(204);

        const res2 = await request(app)
            .get('/api/v1/networks/NET01/gateways/GAT01/sensors/S1')
            .set('Authorization', `Bearer ${token3}`);
        expect(res2.status).toBe(200);
        expect(res2.body.macAddress).toBe("S1");
        expect(res2.body.name).toBe("Updated Sensor1");
    });

    it('update sensor: partial update', async () => {
        const updatedSensor = {
            macAddress: "S1",
            name: "Partially Updated Sensor1",
            description: undefined,
            variable: undefined,
            unit: "Farenheit" // Only updating unit
        };
        const res = await request(app)
            .patch('/api/v1/networks/NET01/gateways/GAT01/sensors/S1')
            .set('Authorization', `Bearer ${token}`)
            .send(updatedSensor);
        expect(res.status).toBe(204);

        const res2 = await request(app)
            .get('/api/v1/networks/NET01/gateways/GAT01/sensors/S1')
            .set('Authorization', `Bearer ${token}`);
        expect(res2.status).toBe(200);
        expect(res2.body.macAddress).toBe("S1");
        expect(res2.body.name).toBe("Partially Updated Sensor1");
    });





    it('update sensor: not found', async () => {
        const updatedSensor = {
            macAddress: "S999",
            name: "Nonexistent Sensor",
            description: "This sensor does not exist",
            variable: "Unknown",
            unit: "Unknown"
        };
        const res = await request(app)
            .patch('/api/v1/networks/NET01/gateways/GAT01/sensors/S999')
            .set('Authorization', `Bearer ${token}`)
            .send(updatedSensor);
        expect(res.status).toBe(404);
        expect(res.body.message).toMatch(/Sensor with id 'S999' not found/);
    });

    it('update sensor: bad request', async () => {
        const updatedSensor = {
            macAddress: 123,
            name: "Bad Request Sensor",
            description: "This update should fail due to missing variable",
            unit: "Units",
            variable: "testing variable"
        };
        const res = await request(app)
            .patch('/api/v1/networks/NET01/gateways/GAT01/sensors/S1')
            .set('Authorization', `Bearer ${token}`)
            .send(updatedSensor);
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch("request/body/macAddress must be string");
    });


    it('update sensor: unauthorized', async () => {
        const updatedSensor = {
            macAddress: "S1",
            name: "Unauthorized Update",
            description: "This update should not be allowed",
            variable: "Unauthorized",
            unit: "Units"
        };
        const res = await request(app)
            .patch('/api/v1/networks/NET01/gateways/GAT01/sensors/S1')
            .set('Authorization', `Bearer invalidtoken`)
            .send(updatedSensor);
        expect(res.status).toBe(401);
        expect(res.body.message).toMatch(/Unauthorized/);
    });

    it('update sensor: forbidden', async () => {
        const updatedSensor = {
            macAddress: "S2",
            name: "Forbidden Update",
            description: "This update should not be allowed",
            variable: "Forbidden",
            unit: "Units"
        };
        const res = await request(app)
            .patch('/api/v1/networks/NET01/gateways/GAT01/sensors/S2')
            .set('Authorization', `Bearer ${token3}`)
            .send(updatedSensor);
        expect(res.status).toBe(403);
        expect(res.body.message).toMatch(/Forbidden/);
    });

    it('update sensor: unexisting network', async () => {
        const updatedSensor = {
            macAddress: "S1",
            name: "Unexisting Network Update",
            description: "This update should not be allowed",
            variable: "Unknown",
            unit: "Unknown"
        };
        const res = await request(app)
            .patch('/api/v1/networks/NET99/gateways/GAT01/sensors/S1')
            .set('Authorization', `Bearer ${token}`)
            .send(updatedSensor);
        expect(res.status).toBe(404);
        expect(res.body.message).toMatch(/Network with id 'NET99' not found/);
    });

    it('update sensor: unexisting gateway', async () => {
        const updatedSensor = {
            macAddress: "S1",
            name: "Unexisting gateway Update",
            description: "This update should not be allowed",
            variable: "Unknown",
            unit: "Unknown"
        };
        const res = await request(app)
            .patch('/api/v1/networks/NET01/gateways/GAT99/sensors/S1')
            .set('Authorization', `Bearer ${token}`)
            .send(updatedSensor);
        expect(res.status).toBe(404);
        expect(res.body.message).toMatch(/gateway with MAC address 'GAT99' not found/);
    });

    it('update sensor: conflict with existing macAddress', async () => {
    // Crea un nuovo sensore per il test
    const newSensor = {
        macAddress: "S_CONFLICT",
        name: "Sensor for Conflict Test",
        description: "This sensor will be used to test conflict",
        variable: "Temperature",
        unit: "Celsius"
    };
    await request(app)
        .post('/api/v1/networks/NET01/gateways/GAT01/sensors')
        .set('Authorization', `Bearer ${token}`)
        .send(newSensor);

    // Tenta di aggiornare S2 cambiando il macAddress con quello di S_CONFLICT (che già esiste)
    const updatedSensor = {
        macAddress: "S_CONFLICT", // Questo macAddress esiste già
        name: "Updated Sensor2",
        description: "This should cause a conflict",
        variable: "Humidity",
        unit: "Percentage"
    };
    
    const res = await request(app)
        .patch('/api/v1/networks/NET01/gateways/GAT01/sensors/S2')
        .set('Authorization', `Bearer ${token}`)
        .send(updatedSensor);
    
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/Sensor with macAddress 'S_CONFLICT' already exists/);
});

});

describe('E2E Sensors DELETE', () => {
    it('delete sensor', async () => {
        const res = await request(app)
            .delete('/api/v1/networks/NET01/gateways/GAT01/sensors/S1')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(204);

        const res2 = await request(app)
            .get('/api/v1/networks/NET01/gateways/GAT01/sensors/S1')
            .set('Authorization', `Bearer ${token}`);
        expect(res2.status).toBe(404);
        expect(res2.body.message).toMatch(/Sensor with id 'S1' not found/);
    });

    it('delete sensor: not found', async () => {
        const res = await request(app)
            .delete('/api/v1/networks/NET01/gateways/GAT01/sensors/S999')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(404);
        expect(res.body.message).toMatch(/Sensor with id 'S999' not found/);
    });

    it('delete sensor: unauthorized', async () => {
        const res = await request(app)
            .delete('/api/v1/networks/NET01/gateways/GAT01/sensors/S2')
            .set('Authorization', `Bearer invalidtoken`);
        expect(res.status).toBe(401);
        expect(res.body.message).toMatch(/Unauthorized/);
    });

    it('delete sensor: forbidden', async () => {
        const res = await request(app)
            .delete('/api/v1/networks/NET01/gateways/GAT01/sensors/S2')
            .set('Authorization', `Bearer ${token3}`);
        expect(res.status).toBe(403);
        expect(res.body.message).toMatch(/Forbidden/);
    });

    it('delete sensor: unexisting network', async () => {
        const res = await request(app)
            .delete('/api/v1/networks/NET99/gateways/GAT01/sensors/S2')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(404);
        expect(res.body.message).toMatch(/Network with id 'NET99' not found/);
    });

    it('delete sensor: unexisting gateway', async () => {
        const res = await request(app)
            .delete('/api/v1/networks/NET01/gateways/GAT99/sensors/S2')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(404);
        expect(res.body.message).toMatch(/gateway with MAC address 'GAT99' not found/);
    });

});

describe("Error handling for personalized errors", () => {
    it("Create a new NotFoundError with a code, name, message", () => {
    const customError = {
      status: 404,
      name: "NotFoundError",
      message: "Sensor Not Found"
    };
    const error = createAppError(customError);
    expect(error.code).toBe(404);
    expect(error.name).toBe("NotFoundError");
    expect(error.message).toBe("Sensor Not Found");
  });

  it("Retrieve generic error if  created error is not an AppError instance", () => {
    const fakeError = { something: "not an AppError" };
    const error = createAppError(fakeError);
    expect(error.code).toBe(500);
    expect(error.name).toBe("InternalServerError");
    expect(error.message).toBe("Internal Server Error");
  });
});