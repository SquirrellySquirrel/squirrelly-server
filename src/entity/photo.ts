import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import Post from './post';

@Entity(({ name: 'photos' }))
export default class Photo {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('text')
    path!: string;

    @Column()
    type!: string;

    @Column()
    order!: number;

    @ManyToOne(() => Post, { nullable: false, onDelete: 'CASCADE', orphanedRowAction: 'delete' })
    @JoinColumn({ name: 'post_id' })
    post!: Post;
}