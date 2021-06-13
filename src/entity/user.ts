import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import Collection from "./collection";
import Comment from "./comment";
import Post from "./post";

@Entity(({ name: 'users' }))
export default class User {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ nullable: false, unique: true })
    email!: string;

    @Column({ nullable: false })
    password!: string;

    @Column('timestamp')
    created!: Date;

    @Column('timestamp', { nullable: true })
    lastLogin?: Date;

    @Column({ default: false })
    validated: boolean = false;

    @Column({ name: 'display_name', length: 50, nullable: false })
    @Index()
    displayName!: string;

    @OneToMany(() => Post, post => post.creator)
    posts?: Post[];

    @OneToMany(() => Collection, collection => collection.creator)
    collections?: Collection[];

    @OneToMany(() => Comment, comment => comment.creator, { cascade: ['insert', 'update'] })
    comments?: Comment[];
}