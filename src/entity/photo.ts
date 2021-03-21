import { AfterLoad, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import Post from "./post";

@Entity(({ name: 'photos' }))
export default class Photo {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('text')
    path!: string;

    @Column()
    type!: string;

    @Column('int', { nullable: true })
    height?: number;

    @Column('int', { nullable: true })
    width?: number;

    @Column()
    order!: number;

    @ManyToOne(() => Post, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'post_id' })
    post!: Post;

    protected orientation!: string;

    @AfterLoad()
    getOrientation(): string | undefined {
        if (!this.height || !this.width) {
            return undefined;
        }
        return this.height < this.width ? 'landscape' : 'portrait';
    }
}