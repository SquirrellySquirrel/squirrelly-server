import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import Post from "./post";
import User from "./user";

@Entity(({ name: 'collections' }))
export default class Collection {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'text', length: 50 })
    name!: string;

    @Column({ name: 'text', length: 250, nullable: true })
    description?: string;

    @ManyToOne(() => User, creator => creator.posts, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    creator!: User;

    @ManyToMany(() => Post)
    @JoinTable({
        name: 'collections_posts',
        joinColumn: {
            name: 'collection_id',
            referencedColumnName: 'id'
        },
        inverseJoinColumn: {
            name: 'post_id',
            referencedColumnName: 'id'
        }
    })
    posts!: Post[];
}