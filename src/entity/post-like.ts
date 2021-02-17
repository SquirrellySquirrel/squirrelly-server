import { Entity, JoinColumn, ManyToOne, Unique } from "typeorm";
import { Post } from "./post";
import { User } from "./user";

@Entity(({ name: 'post_likes' }))
@Unique('UQ', ['user', 'post'])
export class PostLike {
    @ManyToOne(type => User, user => user.id, { primary: true, nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @ManyToOne(type => Post, post => post.id, { primary: true, nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: 'post_id' })
    post!: Post;
}