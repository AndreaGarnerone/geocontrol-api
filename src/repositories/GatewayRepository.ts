import {Repository} from "typeorm";
import {GatewayDAO} from "@dao/GatewayDAO";
import {findOrThrowNotFound, throwConflictIfFound} from "@utils";
import {NetworkRepository} from "@repositories/NetworkRepository";
import {AppDataSource} from "@database";

export class GatewayRepository {
    private repo: Repository<GatewayDAO>;

    constructor() {
        this.repo = AppDataSource.getRepository(GatewayDAO);
    }

    async getAllGateways(networkCode: string): Promise<GatewayDAO[]> {
        try {
            const networkRepo = new NetworkRepository();
            const network = await networkRepo.getNetworkById(networkCode);

            return this.repo.find({
                where: {
                    network: {code: network.code}
                }
            });
        } catch (error) {
            throw error;
        }
    }

    async getGatewayByAddress(networkCode: string, gatewayMac: string) {
        const networkRepo = new NetworkRepository();
        const network = await networkRepo.getNetworkById(networkCode);

        return findOrThrowNotFound(
            await this.repo.find({
                where: {
                    network: {code: network.code},
                    macAddress: gatewayMac
                }
            }),
            () => true,
            `gateway with MAC address '${gatewayMac}' not found`
        );
    }

    async createGateways(
        networkCode: string,
        macAddress: string,
        name?: string,
        description?: string
    ): Promise<GatewayDAO> {
        const networkRepo = new NetworkRepository();
        const network = await networkRepo.getNetworkById(networkCode);

        throwConflictIfFound(
            await this.repo.find({
                where: {
                    network: {code: network.code},
                    macAddress
                }
            }),
            () => true,
            `Gateway with id '${macAddress}' already exists`
        );

        return this.repo.save({
            macAddress,
            name,
            description,
            network
        });
    }

    async updateGateway(
        networkCode: string,
        gatewayMac: string,
        updatedMacAddress: string,
        updatedName?: string,
        updatedDescription?: string
    ): Promise<void> {
        try {
            const networkRepo = new NetworkRepository();
            const network = await networkRepo.getNetworkById(networkCode);

            findOrThrowNotFound(
                await this.repo.find({
                    where: {
                        network: {code: network.code},
                        macAddress: gatewayMac
                    }
                }),
                () => true,
                `Gateway with MAC address '${gatewayMac}' not found`
            );

            if (updatedMacAddress !== gatewayMac && updatedMacAddress !== undefined) {
                const existingGateway = await this.repo.find({
                    where: {
                        network: { code: network.code },
                        macAddress: updatedMacAddress
                    }
                });
                throwConflictIfFound(
                    existingGateway,
                    () => true,
                    `MAC address '${updatedMacAddress}' is already in use in this network`
                );
            }

            await this.repo.update(
                {macAddress : gatewayMac},
                {
                    macAddress: updatedMacAddress,
                    name: updatedName,
                    description: updatedDescription,
                    network: network
                }
            );
        } catch (error) {
            throw error;
        }

    }

    async deleteGateway(networkCode: string, macAddress: string): Promise<GatewayDAO[]> {
        try {
            const networkRepo = new NetworkRepository();
            const network = await networkRepo.getNetworkById(networkCode);

            const gateway = findOrThrowNotFound(
                await this.repo.find({
                    where: {
                        network: {code: network.code},
                        macAddress: macAddress
                    }
                }),
                () => true,
                `Gateway with MAC address '${macAddress}' not found`
            );

            return this.repo.remove([gateway]);
        } catch (error) {
            throw error;
        }
    }
}
