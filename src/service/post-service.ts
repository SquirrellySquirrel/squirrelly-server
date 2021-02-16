import { getCustomRepository } from "typeorm";
import { Location } from "../entity/location";
import { Photo } from "../entity/photo";
import { Post } from "../entity/post";
import { PostRepository } from "../repository/post-repository";
import { UserRepository } from "../repository/user-repository";

export class PostService {
    postRepository = getCustomRepository(PostRepository);
    userRepository = getCustomRepository(UserRepository);

    getPost(postId: string): Promise<Post | undefined> {
        return this.postRepository.findOne(postId);
    }

    async savePost(userId: string, location: Location, isPublic: boolean, created: Date, photos: Photo[]): Promise<Post | undefined> {
        const user = await this.userRepository.findOne(userId);
        if (!user) {
            return undefined;
        }

        const post = new Post();
        post.location = location;
        post.creator = user;
        post.public = isPublic;
        post.created = created;
        post.updated = new Date();
        post.photos = photos;
        return this.postRepository.save(post);
    }

}