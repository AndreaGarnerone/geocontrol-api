import { Token as TokenDTO } from "@dto/Token";
import { User as UserDTO } from "@dto/User";
import { UserDAO } from "@models/dao/UserDAO";
import { ErrorDTO } from "@models/dto/ErrorDTO";
import { UserType } from "@models/UserType";
import {Network as NetworkDTO} from "@dto/Network";
import {Gateway as GatewayDTO} from "@dto/Gateway";
import {NetworkDAO} from "@models/dao/NetworkDAO";
import { Sensor as SensorDTO } from "@dto/Sensor";
import { SensorDAO } from "@models/dao/SensorDAO";
import {GatewayDAO} from "@dao/GatewayDAO";
import { MeasurementDAO } from "@models/dao/MeasurementDAO";
import { Measurement as MeasurementDTO } from "@models/dto/Measurement";
import { Stats as StatsDTO } from "@models/dto/Stats";
import { error } from "console";
import { Measurements as MeasurementsDTO } from "@models/dto/Measurements";

export function createErrorDTO(
  code: number,
  message?: string,
  name?: string
): ErrorDTO {
  return removeNullAttributes({
    code,
    name,
    message
  }) as ErrorDTO;
}

export function createTokenDTO(token: string): TokenDTO {
  return removeNullAttributes({
    token: token
  }) as TokenDTO;
}

//------------------------------------------------------------------------------------
// FUNZIONE PER LA CREAZIONE DEL DTO USER E FUNZIONE PER LA SUA MAPPATURA
//------------------------------------------------------------------------------------

export function createUserDTO(
  username: string,
  type: UserType,
  password?: string
): UserDTO {
  return removeNullAttributes({
    username,
    type,
    password
  }) as UserDTO;
}

export function mapUserDAOToDTO(userDAO: UserDAO): UserDTO {
  return createUserDTO(userDAO.username, userDAO.type);
}


//------------------------------------------------------------------------------------
// FUNZIONE PER LA CREAZIONE DEL DTO NETWORK E FUNZIONE PER LA SUA MAPPATURA
//------------------------------------------------------------------------------------

export function createNetworkDTO(
  code: string,
  name?: string,
  description?: string,
  gateways ?: Array<GatewayDTO>
): NetworkDTO{
  return removeNullAttributes({
      code,
      name,
      description,
      gateways
  }) as NetworkDTO;
} 

export function mapNetworkDAOToDTO(networkDAO: NetworkDAO): NetworkDTO {
  return createNetworkDTO(
    networkDAO.code,
    networkDAO.name,
    networkDAO.description,
    networkDAO.gateways ? networkDAO.gateways.map(mapGatewayDAOToDTO) : []
  );
}

//------------------------------------------------------------------------------------
// FUNZIONE PER LA CREAZIONE DEL DTO GATEWAY E FUNZIONE PER LA SUA MAPPATURA
//------------------------------------------------------------------------------------

export function createGatewayDTO(
    macAddress?: string,
    name?: string,
    description?: string,
    sensors?: Array<SensorDTO>
): GatewayDTO {
  return removeNullAttributes({
    macAddress,
    name,
    description,
    sensors
  }) as GatewayDTO;
}

export function mapGatewayDAOToDTO(gatewayDAO: GatewayDAO): GatewayDTO {
  return createGatewayDTO(
    gatewayDAO.macAddress,
    gatewayDAO.name,
    gatewayDAO.description,
    gatewayDAO.sensors ? gatewayDAO.sensors.map(mapSensorDAOToDTO) : []
  );
}

//------------------------------------------------------------------------------------
// FUNZIONE PER LA CREAZIONE DEL DTO SENSOR E FUNZIONE PER LA SUA MAPPATURA
//------------------------------------------------------------------------------------

export function createSensorDTO(
  macAddress?: string,
  name?: string,
  description?: string,
  variable?: string,
  unit?: string
): SensorDTO {
  return removeNullAttributes({
    macAddress,
    name,
    description,
    variable,
    unit
  }) as SensorDTO;
}

export function mapSensorDAOToDTO(sensorDAO: SensorDAO): SensorDTO {
  return createSensorDTO(
    sensorDAO.macAddress,
    sensorDAO.name,
    sensorDAO.description,
    sensorDAO.variable,
    sensorDAO.unit
  );
}

//------------------------------------------------------------------------------------
// FUNZIONE PER LA CREAZIONE DEL DTO MEASUREMENTS E FUNZIONE PER LA SUA MAPPATURA
//------------------------------------------------------------------------------------

export function createMeasurementDTO(
  createdAt: string,
  value: number,
  isOutlier?: boolean
): MeasurementDTO {

 // const createdAtDate = new Date(createdAt).toISOString;
  return removeNullAttributes({
    createdAt: new Date(createdAt),
    value,
    isOutlier
  }) as MeasurementDTO;
}

/**
 * Crea un Measurements DTO 
 */
export function createMeasurementsDTO(
  sensorMacAddress: string,
  stats: StatsDTO,
  measurements: MeasurementDTO[] ): MeasurementsDTO {

  return removeNullAttributes({
    sensorMacAddress: sensorMacAddress,
    stats: stats,
    measurements: measurements
  }) as MeasurementsDTO;
}

export function mapMeasurementDAOToDTO(MeasurementDAO: MeasurementDAO): MeasurementDTO {
  return createMeasurementDTO(
    MeasurementDAO.createdAt,
    MeasurementDAO.value,
    MeasurementDAO.isOutlier
  );
}

/**
 * mappa un array di Misurazioni,
 * Richiama mapMeasurementDAOToDTO per mappare ogni misurazione dell'array in ingresso
 */
export function mapMeasurementsDAOToDTO(MeasurementDAO: MeasurementDAO[], stats: StatsDTO, sensorMac: string): MeasurementsDTO {
  let measurementDTO: MeasurementDTO;
  let arrayDTO : MeasurementDTO[] = [];
  
  for (let measurement of MeasurementDAO){
    measurementDTO = mapMeasurementDAOToDTO(measurement);
    arrayDTO.push(measurementDTO);
  }

  return createMeasurementsDTO(sensorMac, stats, arrayDTO);
}

/**
 * crea un oggetto StatsDTO e lo ritorna
 */
export function createStatsDTO( mean: number, variance: number, upperThreshold: number, lowerThreshold: number, startDate?: any, endDate?: any): StatsDTO{
  const stats : any = {
    mean: mean, variance: variance, upperThreshold: upperThreshold, lowerThreshold: lowerThreshold
  } as StatsDTO;
  if (startDate) stats.startDate = new Date(startDate);
  if (endDate) stats.endDate = new Date(endDate);
  return stats as StatsDTO;
}

/**
 * Calcolo Stats per un intervallo di tempo
 * Richiama createStatsDTO 
 */
export function calculateStats( values: number[], startDate?: Date, endDate?: Date,): StatsDTO {
  let mean = 0, variance = 0, upperThreshold = 0, lowerThreshold = 0, standardDev = 0;
  if (values.length > 0){
    const sum = values.reduce((sum, curr) => sum + curr, 0); //somma dei valori nell'array
    mean = sum/ values.length;

    variance = values.reduce((sum, curr) => sum + Math.pow(curr - mean, 2), 0) / (values.length); //varianza

    standardDev = Math.sqrt(variance); // Deviazione standard

    upperThreshold = mean + 2 * standardDev;
    lowerThreshold = mean - 2 * standardDev;

    return createStatsDTO( mean, variance, upperThreshold, lowerThreshold, startDate, endDate);
  }
}

/**
 *  Ottieni Outlier per misurazioni
 */
export function getOutliers(measurementsArray: MeasurementDAO[], stats: StatsDTO): MeasurementDAO[] {
  
  const upperThreshold = stats.upperThreshold;
  const lowerThreshold = stats.lowerThreshold;
  const measurementFiltered: MeasurementDAO[] = measurementsArray.filter((measurement) => { 
    if( measurement.value < lowerThreshold || measurement.value > upperThreshold){ // aggiunge ai filtered solo gli outlier e setta a true isOutlier
      measurement.isOutlier = true;
      return measurement;
    }
  })
  return measurementFiltered;
}

/* FINE CODICE MEASUREMENTS*/

function removeNullAttributes<T>(dto: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(dto).filter(
      ([_, value]) =>
        value !== null &&
        value !== undefined &&
        (!Array.isArray(value) || value.length > 0)
    )
  ) as Partial<T>;
}
