import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Post } from "./post";
import { User } from "./user";

@Entity(({ name: 'comments' }))
export class Comment {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({
        length: 250
    })
    content!: string;

    @Column('timestamp')
    created!: Date;

    @ManyToOne(type => User, creator => creator.posts, { nullable: false })
    creator!: User;

    @ManyToOne(type => Post, { nullable: false })
    post!: Post;
}