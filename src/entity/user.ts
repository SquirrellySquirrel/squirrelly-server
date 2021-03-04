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

    @OneToMany(() => Device, device => device.owner, { cascade: ['insert'] })
    devices!: Device[];

    @OneToMany(() => Post, post => post.creator)
    posts?: Post[];

    @OneToMany(() => Collection, collection => collection.creator)
    collections?: Collection[];

    @OneToMany(() => Comment, comment => comment.creator, { cascade: ['insert', 'update'] })
    comments?: Comment[];
}