import { Repository } from "typeorm";
import { AppDataSource } from "@database";
import { MeasurementDAO } from "@models/dao/MeasurementDAO";
import { findOrThrowNotFound, parseISODateParamToUTC, throwConflictIfFound } from "@utils";
import { SensorRepository } from "./SensorRepository";

export class MeasurementRepository{

    private repoMeasurement : Repository<MeasurementDAO>; 
    constructor() {
            // Inizializza il repository TypeORM per la gestione dei dati di NetworkDAO
            this.repoMeasurement = AppDataSource.getRepository(MeasurementDAO);
        }

        //Crea misurazione e store su db
        async createMeasurement(
            networkCode: string,
            gatewayMac: string,
            sensorMac: string,
            createdAt: string,
            value: number,
            ): Promise<MeasurementDAO> {
            
                const sensorRepo = new SensorRepository();
                const sensor = await sensorRepo.getSensorById(networkCode, gatewayMac, sensorMac); 
                const createdAtUTC = new Date(createdAt).toUTCString();
            
            return this.repoMeasurement.save({
                createdAt: createdAtUTC,
                value: value,
                isOutlier: false,
                sensor: sensor })

        }

        //Ricava tutte le misurazioni di un sensore specifico
        async getMeasurementsBySensor(
        networkCode: string,
        gatewayMac: string,
        sensorMac: string,
        startDate?: string | any,
        endDate?: string | any
        ): Promise<MeasurementDAO[]> {
        
            const sensorRepo = new SensorRepository();
            const sensor = await sensorRepo.getSensorById(networkCode, gatewayMac, sensorMac);

            // Recupera tutte le misurazioni del sensore ordinate per timestamp
            const measurements = await this.repoMeasurement.find({
                where: { sensor: { macAddress: sensor.macAddress } },
                order: { createdAt: "ASC" }
            });

            // Conversione da ISO a UTC
            const parsedStart = parseISODateParamToUTC(startDate);
            const parsedEnd = parseISODateParamToUTC(endDate);

            // Se non sono forniti, usa la prima e l’ultima data dal DB
            const effectiveStartDate = parsedStart ?? new Date(measurements[0]?.createdAt);
            const effectiveEndDate = parsedEnd ?? new Date(measurements[measurements.length - 1]?.createdAt);

            // Filtro in intervallo
            const measurementsFiltered = measurements.filter( (measurement) =>
                new Date(measurement.createdAt) >= effectiveStartDate && new Date(measurement.createdAt) <= effectiveEndDate );

            return measurementsFiltered;
        }

}