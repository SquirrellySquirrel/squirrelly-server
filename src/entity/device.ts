import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user";

@Entity(({ name: 'devices' }))
export class Device {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne(type => User, owner => owner.devices, { nullable: false })
    @JoinColumn({ name: 'user_id' })
    owner!: User;

    @Column({
        type: 'enum',
        enum: ['android', 'ios']
    })
    type!: string;
}