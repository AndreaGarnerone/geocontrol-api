import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { SensorDAO } from "./SensorDAO";

@Entity("measurement")
export class MeasurementDAO {

    @PrimaryColumn({nullable: false, generated: "increment" })
    measurementId: number;

    @Column({ nullable: false })
    createdAt: string;

    @Column({ nullable: false, type: "float" })
    value: number;

    @Column({ nullable: true })
    isOutlier: boolean;

    @ManyToOne (() => SensorDAO, (sensor) => sensor.measurements, { nullable: false, cascade: true, onDelete: "CASCADE" })
    @JoinColumn({ name: "sensor_id" , referencedColumnName: "sensorId" })
    sensor: SensorDAO;
}