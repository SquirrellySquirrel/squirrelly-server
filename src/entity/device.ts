import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user";

@Entity(({ name: 'devices' }))
export class Device {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne(type => User, owner => owner.devices, { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: 'user_id' })
    owner!: User;

    @Column({
        type: 'enum',
        enum: ['android', 'ios']
    })
    type!: string;

    @Column({ name: 'device_id', length: 50, nullable: false, unique: true })
    deviceId!: string;
}