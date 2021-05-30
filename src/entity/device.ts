import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import User from "./user";

@Entity(({ name: 'devices' }))
export default class Device {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne(() => User, owner => owner.devices, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    owner!: User;

    @Column('enum', {
        enum: ['android', 'ios'],
        nullable: false
    })
    system!: string;

    @Column({ name: 'device_id', length: 50, nullable: false, unique: true })
    deviceId!: string;

    static mapSystem(systemName?: string): string | undefined {
        if (!systemName) {
            console.error('Undefined system name');
            return undefined;
        }

        switch (systemName.toLowerCase()) {
            case 'android':
                return 'android';
            case 'ios':
                return 'ios';
            case 'iphone os':
                return 'ios';
            default:
                console.warn('Unknown system name: ' + systemName);
                return undefined;
        }
    }
}