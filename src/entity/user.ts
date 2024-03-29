import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import Collection from './collection';
import Comment from './comment';
import Post from './post';

export enum UserRole {
    ADMIN = 'admin', CONTRIBUTOR = 'contributor'
}

@Entity(({ name: 'users' }))
export default class User {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ nullable: false, unique: true })
    email!: string;

    // won't be included in SELECT queries by default
    @Column({ nullable: false, select: false })
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

    @Column({
        type: 'enum',
        enum: Object.values(UserRole),
        default: 'contributor',
    })
    role!: string;

    @OneToMany(() => Post, (post) => post.creator)
    posts?: Post[];

    @OneToMany(() => Collection, (collection) => collection.creator)
    collections?: Collection[];

    @OneToMany(() => Comment, (comment) => comment.creator, { cascade: ['insert', 'update'] })
    comments?: Comment[];
}