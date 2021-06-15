import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import Comment from './comment';
import Location from './location';
import Photo from './photo';
import User from './user';

@Entity(({ name: 'posts' }))
export default class Post {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne(() => User, (creator) => creator.posts, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    creator!: User;

    @ManyToOne(() => Location, (location) => location.posts, { nullable: false })
    @JoinColumn({ name: 'location_id' })
    location!: Location;

    @Column('timestamp')
    created!: Date;

    @Column('timestamp')
    updated!: Date;

    @Column({ default: false })
    public: boolean = false;

    @Column('text', { nullable: true })
    description?: string;

    @OneToMany(() => Photo, (photo) => photo.post, { cascade: ['insert'] })
    photos?: Photo[];

    @OneToMany(() => Comment, (comment) => comment.post)
    comments?: Comment[];

    likes: number = 0;

    cover!: Photo;
}