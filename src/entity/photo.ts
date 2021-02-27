import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Post } from "./post";

@Entity(({ name: 'photos' }))
export class Photo {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('text')
    path!: string;

    @Column()
    type!: string;

    @Column('int')
    height!: number;

    @Column('int')
    width!: number;

    @Column()
    orientation!: string;

    @Column()
    order!: number;

    @ManyToOne(type => Post, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'post_id' })
    post!: Post;
}