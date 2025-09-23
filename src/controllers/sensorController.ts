import {Sensor as SensorDTO} from "@dto/Sensor";
import {SensorRepository} from "@repositories/SensorRepository";
import {mapSensorDAOToDTO} from "@services/mapperService";

//Funzione per ottenere tutti i sensori di un gateway
export async function getAllSensors(networkCode: string, gatewayMac: string): Promise<SensorDTO[]> {
    const sensorRepo = new SensorRepository();
    return (await sensorRepo.getAllSensors(networkCode, gatewayMac)).map(mapSensorDAOToDTO);
}

//Funzione per ottenere un sensore specifico
export async function getSensor(networkCode: string, gatewayMac: string, sensorMac: string): Promise<SensorDTO> {
    const sensorRepo = new SensorRepository();
    return mapSensorDAOToDTO(await sensorRepo.getSensorById(networkCode, gatewayMac, sensorMac));
}

//Funzione per creare un sensore
export async function createSensor(networkCode: string, gatewayMac: string, sensorDto: SensorDTO): Promise<void> {
    const sensorRepo = new SensorRepository();
    await sensorRepo.createSensor(networkCode, gatewayMac, sensorDto.macAddress,sensorDto.name,sensorDto.description,sensorDto.variable,sensorDto.unit);
}

//Funzione per eliminare un sensore
export async function deleteSensor(networkCode: string, gatewayMac: string, sensorMac: string): Promise<void> {
    const sensorRepo = new SensorRepository();
    await sensorRepo.deleteSensor(networkCode, gatewayMac, sensorMac);
}

//Funzione per aggiornare un sensore
export async function updateSensor(networkCode: string, gatewayMac: string, oldMacAddress: string, sensorDto: SensorDTO): Promise<void> {
    const sensorRepo = new SensorRepository();
    await sensorRepo.updateSensor(networkCode, gatewayMac, oldMacAddress,sensorDto.macAddress,sensorDto.name,sensorDto.description,sensorDto.variable,sensorDto.unit);
}