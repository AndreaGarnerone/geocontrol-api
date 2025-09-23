import * as sensorController from '@controllers/sensorController';
import { SensorDAO } from '@dao/SensorDAO';
import { NotFoundError } from '@models/errors/NotFoundError';
import { SensorRepository } from '@repositories/SensorRepository';

jest.mock("@repositories/GatewayRepository");
jest.mock("@repositories/SensorRepository");

describe('SensorController Integration test', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("getAllSensors", () => {
        it('should return all sensors', async () => {
            const Sensor1: SensorDAO = {
                sensorId: 1,
                macAddress: 'S1',
                name: 'Sensor1',
                description: 'Test',
                variable: 'Temperature',
                unit: 'Celsius',
                gateway: null,
                measurements: []
            };
            const Sensor2: SensorDAO = {
                sensorId: 2,
                macAddress: 'S2',
                name: 'Sensor2',
                description: 'Test2',
                variable: 'Humidity',
                unit: 'Percent',
                gateway: null,
                measurements: []
            };
            const expectedDTOs = [
                {
                    macAddress: Sensor1.macAddress,
                    name: Sensor1.name,
                    description: Sensor1.description,
                    variable: Sensor1.variable,
                    unit: Sensor1.unit
                },
                {
                    macAddress: Sensor2.macAddress,
                    name: Sensor2.name,
                    description: Sensor2.description,
                    variable: Sensor2.variable,
                    unit: Sensor2.unit
                }
            ];
            (SensorRepository as jest.Mock).mockImplementation(() => ({
                getAllSensors: jest.fn().mockResolvedValue([Sensor1, Sensor2]),
            }));
            const result = await sensorController.getAllSensors('N1', 'GW1');
            expect(result).toEqual(expectedDTOs);
        });
    });

    describe("createSensor", () => {
        it('should create a sensor', async () => {
            const mockCreate = jest.fn().mockResolvedValue(undefined);
            (SensorRepository as jest.Mock).mockImplementation(() => ({
                createSensor: mockCreate,
            }));
            const sentDTO = {
                macAddress: 'S1',
                name: 'Sensor1',
                description: 'Test',
                variable: 'Temperature',
                unit: 'Celsius'
            };

            await expect(sensorController.createSensor('N1', 'GW1', sentDTO)).resolves.toBeUndefined();
            expect(mockCreate).toHaveBeenCalledWith('N1', 'GW1', sentDTO.macAddress, sentDTO.name, sentDTO.description, sentDTO.variable, sentDTO.unit);
            expect(mockCreate).toHaveBeenCalledTimes(1);
        });

        it('should handle error 400 (bad request)', async () => {
            (SensorRepository as jest.Mock).mockImplementation(() => ({
                createSensor: jest.fn().mockRejectedValue(new Error('Bad Request')),
            }));

            const sentDTO = {
                macAddress: 'S1',
                name: 'Sensor1',
                description: 'Test',
                variable: 'Temperature',
                unit: 'Celsius'
            };

            await expect(sensorController.createSensor('N1', 'GW1', sentDTO)).rejects.toThrow('Bad Request');
        });

        it('should handle error 409 (conflict errors)', async () => {
            (SensorRepository as jest.Mock).mockImplementation(() => ({
                createSensor: jest.fn().mockRejectedValue(new Error('Sensor with macAddress \'S1\' already exists')),
            }));

            const sentDTO = {
                macAddress: 'S1',
                name: 'Sensor1',
                description: 'Test',
                variable: 'Temperature',
                unit: 'Celsius'
            };

            await expect(sensorController.createSensor('N1', 'GW1', sentDTO)).rejects.toThrow('Sensor with macAddress \'S1\' already exists');
        });

        it('should handle error 500 (repository error)', async () => {
            (SensorRepository as jest.Mock).mockImplementation(() => ({
                createSensor: jest.fn().mockRejectedValue(new Error('Unexpected error')),
            }));
            const sentDTO = {
                macAddress: 'S1',
                name: 'Sensor1',
                description: 'Test',
                variable: 'Temperature',
                unit: 'Celsius'
            };
            await expect(sensorController.createSensor('N1', 'GW1', sentDTO)).rejects.toThrow('Unexpected error');
        });
    });

    describe("getSensor", () => {
        it('should return a single sensor', async () => {
            const Sensor: SensorDAO = {
                sensorId: 1,
                macAddress: 'S1',
                name: 'Sensore1',
                description: 'Test',
                variable: 'Temperature',
                unit: 'Celsius',
                gateway: null,
                measurements: []
            };

            const expectedDTO = {
                macAddress: Sensor.macAddress,
                name: Sensor.name,
                description: Sensor.description,
                variable: Sensor.variable,
                unit: Sensor.unit
            };

            (SensorRepository as jest.Mock).mockImplementation(() => ({
                getSensorById: jest.fn().mockResolvedValue(Sensor),
            }));

            const result = await sensorController.getSensor('N1', 'GW1', 'S1');

            expect(result).toEqual(expectedDTO);
            expect(result).not.toHaveProperty('sensorId');
            expect(result).not.toHaveProperty('gateway');
        });

        it('should handle error 404 (NotFoundError)', async () => {
            (SensorRepository as jest.Mock).mockImplementation(() => ({
                getSensorById: jest.fn().mockRejectedValue(new Error('Sensor with id \'S1\' not found')),
            }));

            await expect(sensorController.getSensor('N1', 'GW1', 'S1')).rejects.toThrow('Sensor with id \'S1\' not found');
        });
    });

    describe("updateSensor", () => {
        it('should update a sensor', async () => {
            const mockUpdate = jest.fn().mockResolvedValue(undefined);
            (SensorRepository as jest.Mock).mockImplementation(() => ({
                updateSensor: mockUpdate,
            }));

            const sentDTO = {
                macAddress: 'S1',
                name: 'Sensor1',
                description: 'Test',
                variable: 'Temperature',
                unit: 'Celsius'
            };

            await expect(sensorController.updateSensor('N1', 'GW1', 'S1', sentDTO)).resolves.toBeUndefined();
            expect(mockUpdate).toHaveBeenCalledWith('N1', 'GW1', 'S1', sentDTO.macAddress, sentDTO.name, sentDTO.description, sentDTO.variable, sentDTO.unit);
            expect(mockUpdate).toHaveBeenCalledTimes(1);
        });

        it('should handle error 404 (NotFoundError)', async () => {
            (SensorRepository as jest.Mock).mockImplementation(() => ({
                updateSensor: jest.fn().mockRejectedValue(new NotFoundError('Sensor with id \'S1\' not found')),
            }));

            const sentDTO = {
                macAddress: 'S1',
                name: 'Sensor1',
                description: 'Test',
                variable: 'Temperature',
                unit: 'Celsius'
            };

            await expect(sensorController.updateSensor('N1', 'GW1', 'S1', sentDTO)).rejects.toThrow('Sensor with id \'S1\' not found');
        });

        it('should handle error 400 (bad request)', async () => {
            (SensorRepository as jest.Mock).mockImplementation(() => ({
                updateSensor: jest.fn().mockRejectedValue(new Error('Bad Request')),
            }));
            const sentDTO = {
                macAddress: 'S1',
                name: 'Sensor1',
                description: 'Test',
                variable: 'Temperature',
                unit: 'Celsius'
            };
            await expect(sensorController.updateSensor('N1', 'GW1', 'S1', sentDTO)).rejects.toThrow('Bad Request');
        });

        it('should handle repository errors', async () => {
            (SensorRepository as jest.Mock).mockImplementation(() => ({
                updateSensor: jest.fn().mockRejectedValue(new Error('Unexpected error')),
            }));

            const sentDTO = {
                macAddress: 'S1',
                name: 'Sensor1',
                description: 'Test',
                variable: 'Temperature',
                unit: 'Celsius'
            };

            await expect(sensorController.updateSensor('N1', 'GW1', 'S1', sentDTO)).rejects.toThrow('Unexpected error');
        });
    });

    describe("deleteSensor", () => {
        it('should delete a sensor', async () => {
            const mockDelete = jest.fn().mockResolvedValue(undefined);
            (SensorRepository as jest.Mock).mockImplementation(() => ({
                deleteSensor: mockDelete,
            }));

            await expect(sensorController.deleteSensor('N1', 'GW1', 'S1')).resolves.toBeUndefined();
            expect(mockDelete).toHaveBeenCalledWith('N1', 'GW1', 'S1');
            expect(mockDelete).toHaveBeenCalledTimes(1);
        });

        it('should handle error 404 (NotFoundError)', async () => {
            (SensorRepository as jest.Mock).mockImplementation(() => ({
                deleteSensor: jest.fn().mockRejectedValue(new NotFoundError('Sensor with id \'S1\' not found')),
            }));

            await expect(sensorController.deleteSensor('N1', 'GW1', 'S1')).rejects.toThrow('Sensor with id \'S1\' not found');
        });

        it('should handle repository errors', async () => {
            (SensorRepository as jest.Mock).mockImplementation(() => ({
                deleteSensor: jest.fn().mockRejectedValue(new Error('Unexpected error')),
            }));
            await expect(sensorController.deleteSensor('N1', 'GW1', 'S1')).rejects.toThrow('Unexpected error');
        });
    });
});