import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
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

    @ManyToOne(() => User, creator => creator.comments, { nullable: false })
    @JoinColumn({ name: 'user_id' })
    creator!: User;

    @ManyToOne(() => Post, post => post.comments, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'post_id' })
    post!: Post;
}