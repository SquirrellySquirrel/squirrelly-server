import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity(({ name: 'photos' }))
export class Photo {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('text')
    path!: string;

    @Column()
    type!: string;

    @Column('int')
    height!: number;

    @Column('int')
    width!: number;

    @Column()
    orientation!: string;
}