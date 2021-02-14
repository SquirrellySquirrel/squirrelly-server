import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Comment } from "./comment";
import { Location } from "./location";
import { Photo } from "./photo";
import { User } from "./user";

@Entity(({ name: 'posts' }))
export class Post {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne(type => User, creator => creator.posts, { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: 'user_id' })
    creator!: User;

    @ManyToOne(type => Location, location => location.posts, { nullable: false })
    @JoinColumn({ name: 'location_id' })
    location!: Location;

    @Column('timestamp')
    created!: Date;

    @Column('timestamp')
    updated!: Date;

    @Column()
    public!: boolean;

    @OneToMany(type => Photo, photo => photo.id, { cascade: ["insert", "update"], onDelete: "CASCADE" })
    photos?: Photo[];

    @OneToMany(type => Comment, comment => comment.post, { onDelete: "CASCADE" })
    comments?: Comment[];

}