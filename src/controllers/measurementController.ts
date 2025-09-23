import { Measurement as MeasurementDTO} from "@models/dto/Measurement";
import { MeasurementRepository } from "@repositories/MeasurementRepository";
import { SensorRepository } from "@repositories/SensorRepository";
import { calculateStats, createStatsDTO, getOutliers } from "@services/mapperService";
import { mapMeasurementsDAOToDTO } from "@services/mapperService";
import { Stats as StatsDTO} from "@models/dto/Stats";
import { GatewayDAO } from "@models/dao/GatewayDAO";
import {  parseISODateParamToUTC, parseStringArrayParam } from "@utils";
import { Measurements as MeasurementsDTO} from "@models/dto/Measurements";
import { SensorDAO } from "@models/dao/SensorDAO";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { NetworkRepository } from "@repositories/NetworkRepository";
import { MeasurementDAO } from "@models/dao/MeasurementDAO";

// Creare una misurazione dalla Repository, converte in DTO
export async function createMeasurement(networkCode: string, gatewayMac: string, sensorMac: string, measurementDTO: MeasurementDTO): Promise<void> {
    
    const measurementRepo = new MeasurementRepository();
    const DatetoString = measurementDTO.createdAt.toString();
    await measurementRepo.createMeasurement( networkCode, gatewayMac, sensorMac, DatetoString, measurementDTO.value);
}

//Ricavare tutte le misurazioni di uno specifico sensore
export async function getMeasurementsBySensor(networkCode: string, gatewayMac: string, sensorMac: string, startDate? : any, endDate?: any): Promise<any> {
    
    const measurementRepo = new MeasurementRepository();
    const measurementDao : MeasurementDAO[] | null = await measurementRepo.getMeasurementsBySensor(networkCode, gatewayMac, sensorMac, startDate, endDate)
    
    const parsedStartDate = parseISODateParamToUTC(startDate);
    const parsedEndDate = parseISODateParamToUTC(endDate);
    if(measurementDao.length === 0){
        const stats = createStatsDTO(0, 0, 0, 0, parsedStartDate?.toISOString(), parsedEndDate?.toISOString());
        return {sensorMacAddress: sensorMac, stats, measurements: []};
    }
    const effectiveStartDate = parsedStartDate ?? new Date(measurementDao[0].createdAt);
    const effectiveEndDate = parsedEndDate ?? new Date(measurementDao[measurementDao.length - 1].createdAt);
    const values : number[] = measurementDao.map((measurement) => {return measurement.value});
    const statsSensor: StatsDTO = calculateStats(values, effectiveStartDate, effectiveEndDate); // calcolo delle stats
    let measurementsDTO  = mapMeasurementsDAOToDTO(measurementDao, statsSensor, sensorMac);
    return measurementsDTO;
}

//Ricavare tutti le misurazioni con Outlier di uno specifico sensore
export async function getOutlierMeasurementsBySensor(networkCode: string, gatewayMac: string, sensorMac: string, startDate? : any, endDate?: any): Promise<MeasurementsDTO> {
    const measurementRepo = new MeasurementRepository();
    const measurementDao = await measurementRepo.getMeasurementsBySensor(networkCode, gatewayMac, sensorMac, startDate, endDate);
    const parsedStartDate = parseISODateParamToUTC(startDate);
    const parsedEndDate = parseISODateParamToUTC(endDate);
    if(measurementDao.length === 0){
        const stats = createStatsDTO(0, 0, 0, 0, parsedStartDate?.toISOString(), parsedEndDate?.toISOString());
        return {sensorMacAddress: sensorMac, stats, measurements: []};
    }
    const effectiveStartDate = parsedStartDate ?? new Date(measurementDao[0].createdAt);
    const effectiveEndDate = parsedEndDate ?? new Date(measurementDao[measurementDao.length - 1].createdAt);
    const values : number[] = measurementDao.map((measurement) => {return measurement.value});
    const statsSensor : StatsDTO = calculateStats( values, effectiveStartDate, effectiveEndDate);
    const outlier = getOutliers(measurementDao, statsSensor);
    let measurementsDTO = mapMeasurementsDAOToDTO(outlier, statsSensor, sensorMac);
    return measurementsDTO;
}

//Ricavare le Stats di uno specifico Sensore
export async function getStatsBySensor(networkCode: string, gatewayMac: string, sensorMac: string, startDate? : any, endDate?: any): Promise<StatsDTO>{
    
    const measurementRepo = new MeasurementRepository();
    const measurementDao = await measurementRepo.getMeasurementsBySensor(networkCode, gatewayMac, sensorMac, startDate, endDate)
    const parsedStartDate = parseISODateParamToUTC(startDate);
    const parsedEndDate = parseISODateParamToUTC(endDate);
    if(measurementDao.length === 0){
        const stats = createStatsDTO(0, 0, 0, 0, parsedStartDate?.toISOString(), parsedEndDate?.toISOString());
        return stats;
    }
    const effectiveStartDate = parsedStartDate ?? new Date(measurementDao[0].createdAt);
    const effectiveEndDate = parsedEndDate ?? new Date(measurementDao[measurementDao.length - 1].createdAt);
    const values : number[] = measurementDao.map((measurement) => {return measurement.value});
    const statsSensor: StatsDTO = calculateStats( values, effectiveStartDate, effectiveEndDate); // calcolo delle stats
    return statsSensor;
}

//Ricavare le misurazioni per un set di Sensori
export async function getMeasurementsByNetwork(networkCode: string, sensorMacsArray?: any , startDate? : any, endDate?: any): Promise<MeasurementsDTO[]>{
    
    const gatewayRepo = new GatewayRepository();
    const gatewaysArray : GatewayDAO[] = await gatewayRepo.getAllGateways(networkCode);
    const sensorRepo = new SensorRepository();
    const effSensorMacs = parseStringArrayParam(sensorMacsArray);
    let results = [];
    let allSensors: SensorDAO[];
    for (let gateway of gatewaysArray) { // recupero tutti i sensori
        allSensors = await sensorRepo.getAllSensors(networkCode, gateway.macAddress);
        if (effSensorMacs !== undefined) {
            let filteredSensors: SensorDAO[];
            filteredSensors = allSensors.filter(sensor => effSensorMacs.includes(sensor.macAddress));
            for (let sensor of filteredSensors){ // per ogni sensore
                let measurementsDto = await getMeasurementsBySensor(networkCode, gateway.macAddress, sensor.macAddress, startDate, endDate );
                effSensorMacs.splice(effSensorMacs.indexOf(sensor.macAddress), 1);
                results.push(measurementsDto ) ;
            }
        }else {
            for (let sensor of allSensors){ // per ogni sensore
                let measurementsDto = await getMeasurementsBySensor(networkCode, gateway.macAddress, sensor.macAddress, startDate, endDate );
                results.push(measurementsDto) ;
            }
        }
    }

    return results;    
}

//Ricavare gli Outlier di una Network specifica
export async function getOutlierByNetwork(networkCode: string, sensorMacs?: any, startDate?: any, endDate?: any): Promise<MeasurementsDTO[]>{

    const gatewayRepo = new GatewayRepository();
    const gatewaysArray : GatewayDAO[] = await gatewayRepo.getAllGateways(networkCode);
    const sensorRepo = new SensorRepository();
    
    const effSensorMacs = parseStringArrayParam(sensorMacs);
    
    let results = [];
    let allSensors: SensorDAO[];
    
    for (let gateway of gatewaysArray) { // recupero tutti i sensori
        allSensors = gateway.sensors = await sensorRepo.getAllSensors(networkCode, gateway.macAddress);
        
        if (effSensorMacs !== undefined) {
            let filteredSensors: SensorDAO[];
            filteredSensors = allSensors.filter(sensor => effSensorMacs.includes(sensor.macAddress));
            for (let sensor of filteredSensors){ // per ogni sensore
                let measurementsDto = await getOutlierMeasurementsBySensor(networkCode, gateway.macAddress, sensor.macAddress, startDate, endDate );
                effSensorMacs.splice(effSensorMacs.indexOf(sensor.macAddress), 1);
                results.push(measurementsDto ) ;
            }
        }else {
            for (let sensor of allSensors){ // per ogni sensore
                let measurementsDto = await getOutlierMeasurementsBySensor(networkCode, gateway.macAddress, sensor.macAddress, startDate, endDate );

                results.push(measurementsDto) ;
            }
        }
    }

    return results;
}

// Ricavare le stats di una Network specifica
export async function getStatsByNetwork(networkCode: string, sensorMacs?: any, startDate?: any, endDate?: any){
    
    const gatewayRepo = new GatewayRepository();
    const gatewaysArray : GatewayDAO[] = await gatewayRepo.getAllGateways(networkCode);
    const sensorRepo = new SensorRepository();
    
    const effSensorMacs = parseStringArrayParam(sensorMacs);

    let results = [];
    let allSensors = [];

    for (let gateway of gatewaysArray) { // recupero tutti i sensori
        allSensors = gateway.sensors = await sensorRepo.getAllSensors(networkCode, gateway.macAddress);
        
        if (effSensorMacs !== undefined) {
            let filteredSensors: SensorDAO[];
            filteredSensors = allSensors.filter(sensor => effSensorMacs.includes(sensor.macAddress));

            for (let sensor of filteredSensors){ // per ogni sensore
                let statsDto = await getStatsBySensor(networkCode, gateway.macAddress, sensor.macAddress, startDate, endDate );
                effSensorMacs.splice(effSensorMacs.indexOf(sensor.macAddress), 1);
                results.push(mapMeasurementsDAOToDTO([], statsDto, sensor.macAddress) );
            };
        }else {
            for (let sensor of allSensors){ // per ogni sensore
                let statsDto = await getStatsBySensor(networkCode, gateway.macAddress, sensor.macAddress, startDate, endDate );
                results.push(mapMeasurementsDAOToDTO([], statsDto, sensor.macAddress) );
            }
        }
    }

    return results;    

}