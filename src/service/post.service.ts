import { Service } from 'typedi';
import { DeleteResult } from "typeorm";
import { InjectRepository } from 'typeorm-typedi-extensions';
import Photo from "../entity/photo";
import Post from "../entity/post";
import TypeORMException from '../exception/typeorm.exception';
import PostRepository from "../repository/post.repository";
import PhotoService from "./photo.service";
import PostLikeService from "./post-like.service";

@Service()
export default class PostService {
    constructor(
        @InjectRepository() private readonly postRepository: PostRepository,
        private readonly photoService: PhotoService,
        private readonly postLikeService: PostLikeService
    ) { }

    async getPosts(count: number): Promise<Post[]> {
        const posts = await this.postRepository.find({ take: count, order: { created: 'DESC' } });
        for (const post of posts) {
            const cover = await this.photoService.getPostCover(post.id);
            if (cover) {
                post.cover = cover;
            }
        }
        return posts;
    }

    async getPostsByUser(userId: string): Promise<Post[]> {
        const posts = await this.postRepository.find({ where: { creator: { id: userId } }, order: { created: 'DESC' } });
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

    async savePost(userId: string, locationId: string, isPublic: boolean, created: Date, photos: Photo[]): Promise<Post> {
        return await this.postRepository.save({
            location: { id: locationId },
            creator: { id: userId },
            public: isPublic,
            created: created,
            updated: new Date(),
            photos: photos
        }).catch((err: Error) => {
            throw new TypeORMException(err.message);
        });
    }

    async updatePost(postId: string, locationId: string, isPublic: boolean, created: Date, photos: Photo[]): Promise<Post> {
        const post = await this.postRepository.save({
            id: postId,
            location: { id: locationId },
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