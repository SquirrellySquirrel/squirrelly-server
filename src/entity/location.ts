import { Column, Double, Entity, OneToMany, PrimaryGeneratedColumn, Unique } from "typeorm";
import Post from "./post";

@Entity(({ name: 'locations' }))
@Unique('UQ_locations_latitude_longitude', ['latitude', 'longitude'])
export default class Location {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('double')
    latitude!: Double;

    @Column('double')
    longitude!: Double;

    @Column('text', { nullable: true })
    address?: string;

    @OneToMany(type => Post, post => post.location)
    posts!: Post[];
}