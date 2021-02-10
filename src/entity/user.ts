import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Collection } from "./collection";
import { Comment } from "./comment";
import { Device } from "./device";
import { Post } from "./post";

@Entity(({ name: 'users' }))
export class User {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ nullable: true, unique: true })
    email?: string;

    @Column({ nullable: true })
    password?: string;

    @Column({ name: 'display_name', length: 50, nullable: true, unique: true })
    displayName?: string;

    @OneToMany(type => Device, device => device.owner)
    devices!: Device[];

    @OneToMany(type => Post, post => post.creator)
    posts?: Post[];

    @OneToMany(type => Collection, collection => collection.creator)
    collections?: Collection[];

    @OneToMany(type => Comment, comment => comment.creator)
    comments?: Comment[];
}