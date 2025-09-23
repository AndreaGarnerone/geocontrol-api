import {Gateway as GatewayDTO} from "@dto/Gateway";
import {GatewayRepository} from "@repositories/GatewayRepository";
import {mapGatewayDAOToDTO} from "@services/mapperService";

import AppError from "@errors/AppError";
import { SensorRepository } from "@repositories/SensorRepository";

export async function getAllGateways(networkCode: string): Promise<GatewayDTO[]> {
    try {
        const gatewayRepo = new GatewayRepository();
        const sensorRepo = new SensorRepository;
        const gateways = await gatewayRepo.getAllGateways(networkCode);
        for (const gateway of gateways) {
            gateway.sensors = await sensorRepo.getAllSensors(networkCode, gateway.macAddress);
        }
        return gateways.map(mapGatewayDAOToDTO);
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError(`Internal server error`, 500);
    }
}

export async function getGateway(networkCode: string, gatewayMac: string): Promise<GatewayDTO> {
    try {
        const gatewayRepo = new GatewayRepository();
        const sensorRepo = new SensorRepository();
        const gateway = await gatewayRepo.getGatewayByAddress(networkCode, gatewayMac);
        gateway.sensors = await sensorRepo.getAllSensors(networkCode, gatewayMac);
        return mapGatewayDAOToDTO(gateway);
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError(`Internal server error`, 500);
    }
}

export async function createGateway(networkCode: string, gatewayDto: GatewayDTO): Promise<GatewayDTO> {
    try {
        const gatewayRepo = new GatewayRepository();
        return mapGatewayDAOToDTO(await gatewayRepo.createGateways(networkCode, gatewayDto.macAddress, gatewayDto.name, gatewayDto.description));
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError(`Internal server error`, 500);
    }
}

export async function updateGateway(networkCode: string, updatedMac: string, gatewayDto: GatewayDTO): Promise<void> {
    try {
        const gatewayRepo = new GatewayRepository();
        return await gatewayRepo.updateGateway(networkCode, updatedMac, gatewayDto.macAddress, gatewayDto.name, gatewayDto.description);
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError(`Internal server error`, 500);
    }
}

export async function deleteGateway(networkCode: string, gatewayMac: string): Promise<GatewayDTO[]> {
    try {
        const gatewayRepo = new GatewayRepository();
        return await gatewayRepo.deleteGateway(networkCode, gatewayMac)
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError(`Internal server error`, 500);
    }
}