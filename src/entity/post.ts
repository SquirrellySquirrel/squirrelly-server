import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Comment } from "./comment";
import { Location } from "./location";
import { User } from "./user";

@Entity(({ name: 'posts' }))
export class Post {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne(type => User, creator => creator.posts, { nullable: false })
    creator!: User;

    @ManyToOne(type => Location, location => location.posts, { nullable: false })
    location!: Location;

    @Column('timestamp')
    created!: Date;

    @Column('timestamp')
    updated!: Date;

    @Column()
    public!: boolean;

    @OneToMany(type => Comment, comment => comment.post)
    comments?: Comment[];
}