import { Entity, JoinColumn, ManyToOne } from "typeorm";
import { Post } from "./post";
import { User } from "./user";

@Entity(({ name: 'post_likes' }))
export class PostLike {
    @ManyToOne(type => User, user => user.id, { primary: true, nullable: false })
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @ManyToOne(type => Post, post => post.id, { primary: true, nullable: false })
    @JoinColumn({ name: 'post_id' })
    post!: Post;
}