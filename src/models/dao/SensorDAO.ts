import { Entity, PrimaryColumn, Column, ManyToMany, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { GatewayDAO } from "./GatewayDAO";
import { MeasurementDAO } from "./MeasurementDAO";

@Entity("sensors")
export class SensorDAO {
    
    @PrimaryColumn({nullable: false, generated: "increment"})
    sensorId: number;

    @Column({ nullable: false , unique: true})
    macAddress: string;
    
    @Column({ nullable: true })
    name: string;
    
    @Column({ nullable: true })
    description: string;
    
    @Column({ nullable: true })
    variable: string;

    @Column({ nullable: true })
    unit: string;


    @ManyToOne(() => GatewayDAO, gateway => gateway.sensors, { nullable: false, cascade: true, onDelete: "CASCADE"})
    @JoinColumn({ name: "gateway_id", referencedColumnName: "gatewayId" })
    gateway: GatewayDAO;

    @OneToMany(() => MeasurementDAO, measurement => measurement.sensor, { nullable: true })
    measurements: MeasurementDAO[];
}