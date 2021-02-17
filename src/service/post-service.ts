import { getCustomRepository } from "typeorm";
import { Location } from "../entity/location";
import { Photo } from "../entity/photo";
import { Post } from "../entity/post";
import { PostRepository } from "../repository/post-repository";
import { PostLikeService } from "../service/post-like-service";

export class PostService {
    postRepository = getCustomRepository(PostRepository);
    postLikeService = new PostLikeService();

    async getPost(postId: string): Promise<Post | undefined> {
        const post = await this.postRepository.findOne({ where: { id: postId }, relations: ["creator", "location", "photos", "comments"] });
        if (!post) {
            return undefined;
        }

        post.likes = (await this.postLikeService.getPostLikes(postId)).length;
        return post;
    }

    savePost(userId: string, location: Location, isPublic: boolean, created: Date, photos: Photo[]): Promise<Post | undefined> {
        return this.postRepository.save({
            location: location,
            creator: { id: userId },
            public: isPublic,
            created: created,
            updated: new Date(),
            photos: photos
        });
    }
}