import { DeleteResult } from "typeorm";
import { Location } from "../entity/location";
import { Photo } from "../entity/photo";
import { Post } from "../entity/post";
import { PostRepository } from "../repository/post-repository";
import { PhotoService } from "./photo-service";
import { PostLikeService } from "./post-like-service";

export class PostService {
    public constructor(
        private readonly postRepository: PostRepository,
        private readonly photoService: PhotoService,
        private readonly postLikeService: PostLikeService
    ) { }

    async getPosts(count: number): Promise<Post[] | undefined> {
        const posts = await this.postRepository.find({ take: count });
        for (const post of posts) {
            const cover = await this.photoService.getPostCover(post.id);
            if (cover) {
                post.cover = cover;
            }
        }
        return posts;
    }

    async getPostsByUser(userId: string): Promise<Post[] | undefined> {
        const posts = await this.postRepository.find({ where: { creator: { id: userId } } });
        for (const post of posts) {
            const cover = await this.photoService.getPostCover(post.id);
            if (cover) {
                post.cover = cover;
            }
        }
        return posts;
    }

    async getPost(postId: string): Promise<Post | undefined> {
        const post = await this.postRepository.findOne({ where: { id: postId }, relations: ["creator", "location", "photos", "comments", "comments.creator"] });
        if (!post) {
            return undefined;
        }

        post.likes = (await this.postLikeService.getPostLikes(postId)).length;
        return post;
    }

    async savePost(userId: string, location: Location, isPublic: boolean, created: Date, photos: Photo[]): Promise<Post> {
        return await this.postRepository.save({
            location: location,
            creator: { id: userId },
            public: isPublic,
            created: created,
            updated: new Date(),
            photos: photos
        });
    }

    async updatePost(postId: string, location: Location, isPublic: boolean, created: Date, photos: Photo[]): Promise<Post> {
        const post = await this.postRepository.save({
            id: postId,
            location: location,
            public: isPublic,
            created: created,
            updated: new Date()
        });
        for (let photo of photos) {
            photo.post = post;
        }
        await this.photoService.upsertPhotosByPost(post.id, photos);
        return post;
    }

    deletePost(postId: string): Promise<DeleteResult> {
        return this.postRepository.delete(postId);
    }
}