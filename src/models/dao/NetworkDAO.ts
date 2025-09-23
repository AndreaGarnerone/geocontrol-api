import { Entity, PrimaryColumn, Column, ManyToMany, OneToMany } from "typeorm";
import { GatewayDAO } from "./GatewayDAO";

@Entity("networks")
export class NetworkDAO {
  @PrimaryColumn({ nullable: false , generated:"increment"})
  networkId: number;
  
  @Column({ nullable: false , unique: true})
  code: string;

  @Column({ nullable: true })
  name: string;
  
  @Column({ nullable: true })
  description: string;

  @OneToMany( () => GatewayDAO, gateway => gateway.network )
  gateways: GatewayDAO[];

}