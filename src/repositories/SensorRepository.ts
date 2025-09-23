import { AppDataSource } from "@database";
import { Repository } from "typeorm";
import { SensorDAO } from "@dao/SensorDAO";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { findOrThrowNotFound, throwConflictIfFound } from "@utils";
import { NotFoundError } from "@errors/NotFoundError";
import { BadRequest } from "express-openapi-validator/dist/openapi.validator";
import e from "express";

//Class per la gestione dei sensori
export class SensorRepository {
    private repo: Repository<SensorDAO>;

    constructor() {
        this.repo = AppDataSource.getRepository(SensorDAO);
    }

    //Funzione per ottenere tutti i sensori di un gateway, che utilizza la funzione getGatewayByAddress della classe GatewayRepository
    //Restituisce un array di oggetti SensorDAO, se non trova il gateway lancia un errore NotFoundError
    async getAllSensors(networkCode: string, gatewayMac: string): Promise<SensorDAO[]> {
        try{
            const gatewayRepo = new GatewayRepository();
            const gateway = await gatewayRepo.getGatewayByAddress(networkCode, gatewayMac); // Ottieni il gateway


            if (!gateway) {
                throw new NotFoundError(`Gateway with macAddress '${gatewayMac}' not found`);
            }

            return this.repo.find({
                where: {
                    gateway: { macAddress: gateway.macAddress } // Usa il macAddress del gateway per filtrare i sensori
                }
            });
        }
        catch (error) {
            /*if (error instanceof NotFoundError) {
                throw new NotFoundError(`Impossibile trovare i sensori: ${error.message}`);
            }*/
            throw error;
        }
    }

    //Funzione per ottenere un sensore specifico, che utilizza la funzione getGatewayByAddress della classe GatewayRepository
    async getSensorById(networkCode: string, gatewayMac: string, sensorMac: string): Promise<SensorDAO> {
        const gatewayRepo = new GatewayRepository();
        const gateway = await gatewayRepo.getGatewayByAddress(networkCode, gatewayMac); // Ottieni il gateway
        
        if (!gateway) {
            throw new NotFoundError(`Gateway with macAddress '${gatewayMac}' not found`);
        }

        return findOrThrowNotFound(
            await this.repo.find({
                 where: {
                    gateway: { macAddress: gateway.macAddress }, // Usa il macAddress del gateway per filtrare i sensori
                    macAddress: sensorMac                        // Filtra per macAddress del sensore  
                }
             }),
            () => true,
            `Sensor with id '${sensorMac}' not found`
        );
    }

    //Funzione per creare un sensore, che utilizza la funzione getGatewayByAddress della classe GatewayRepository
    //Servono, oltre ai paramteri del sensore, anche il networkCode e il gatewayMac
    async createSensor(
        networkCode: string,
        gatewayMac: string,
        sensorMac: string,
        name: string,
        description: string,
        variable: string,
        unit: string
    ): Promise<SensorDAO> {
        if (!networkCode || !gatewayMac || !sensorMac) {
            throw new BadRequest({
                path: '.',
                message: "Network code, gateway mac address and sensor mac address are required"
            }); 
        }
        const gatewayRepo = new GatewayRepository();
        const gateway = await gatewayRepo.getGatewayByAddress(networkCode, gatewayMac);
        throwConflictIfFound(
            await this.repo.find({ where: {
                gateway: { macAddress: gateway.macAddress },
                macAddress: sensorMac
             }
             }),
            () => true,
            `Sensor with macAddress '${sensorMac}' already exists`
        );

        return this.repo.save({ //Creazione del sensore
            macAddress: sensorMac,
            name: name,
            description: description,
            variable: variable,
            unit: unit,
            gateway: gateway

        });
    }

    //Funzione per aggiornare un sensore, che utilizza la funzione getGatewayByAddress della classe GatewayRepository
    //Servono, oltre ai paramteri del sensore, anche il networkCode e il gatewayMac
    async updateSensor( 
        networkCode: string,
        gatewayMac: string,
        curSensorMac: string,
        newSensorMac: string,
        name: string,
        description: string,
        variable: string,
        unit: string
    ): Promise<void> {
        if (!networkCode || !gatewayMac || !curSensorMac || !newSensorMac) {
            throw new BadRequest({
                path: '.',
                message: "Network code, gateway mac address and sensor mac address are required"
            }); 
        }

        const sensor = await this.getSensorById(networkCode, gatewayMac, curSensorMac);
        // Se il codice è cambiato, controlla che quello nuovo non esista già
        if (newSensorMac !== curSensorMac) {
            throwConflictIfFound(
                await this.repo.find({ where: { macAddress: newSensorMac } }), // Controlla se esiste già un sensore con il nuovo macAddress
                () => true,
                `Sensor with macAddress '${newSensorMac}' already exists`
            );
        }

        // Esegui l'aggiornamento
        await this.repo.update({macAddress: curSensorMac},{
        macAddress: newSensorMac ?? sensor.macAddress, // Usa il nuovo macAddress se fornito, altrimenti mantiene quello attuale
        name: name ?? sensor.name, // Usa il nuovo nome se fornito, altrimenti mantiene quello attuale
        description:  description ?? sensor.description, // Usa la nuova descrizione se fornita, altrimenti mantiene quella attuale
        variable: variable ?? sensor.variable, // Usa la nuova variabile se fornita, altrimenti mantiene quella attuale
        unit: unit ?? sensor.unit, // Usa la nuova unità se fornita, altrimenti mantiene quella attuale
        });
    }
    
    //Funzione per eliminare un sensore
    async deleteSensor(networkCode: string, gatewayMac: string, sensorMac: string): Promise<void> {
        await this.repo.remove(await this.getSensorById(networkCode, gatewayMac, sensorMac));
    }
}