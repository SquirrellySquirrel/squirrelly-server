import { AfterLoad, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
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
    order!: number;

    @ManyToOne(() => Post, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'post_id' })
    post!: Post;

    protected orientation!: string;

    @AfterLoad()
    getOrientation(): string {
        return this.height < this.width ? 'landscape' : 'portrait';
    }
}