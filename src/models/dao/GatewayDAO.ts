import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { SensorDAO } from "./SensorDAO";
import { NetworkDAO } from "./NetworkDAO";

@Entity("gateways")
export class GatewayDAO {

    @PrimaryColumn({nullable: false, generated: "increment"})
    gatewayId: number;

    @Column({ nullable: false, unique: true })
    macAddress: string;
    
    @Column({ nullable: true })
    name: string;
    
    @Column({ nullable: true })
    description: string;
    
    @OneToMany(() => SensorDAO, sensor => sensor.gateway,  { nullable: false })
    sensors: SensorDAO[];

    @ManyToOne(() => NetworkDAO, network => network.gateways, { nullable: false , cascade: true, onDelete: "CASCADE"})
    @JoinColumn({ name: "network_id", referencedColumnName: "networkId" })
    network: NetworkDAO;

    }