import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Post } from "./post";
import { User } from "./user";

@Entity(({ name: 'collections' }))
export class Collection {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('text')
    name!: string;

    @Column('text', { nullable: true })
    description?: string;

    @ManyToOne(type => User, creator => creator.posts, { nullable: false })
    creator!: User;

    @OneToMany(type => Post, post => post.location)
    posts!: Post[];
}