import { Service } from 'typedi';
import { InjectRepository } from 'typeorm-typedi-extensions';
import Post from '../entity/post';
import User, { UserRole } from '../entity/user';
import PermissionDeniedException from '../exception/permission-denied.exception';
import UnprocessableEntityException from '../exception/unprocessable-entity.exception';
import CollectionRepository from '../repository/collection.repository';
import CommentRepository from '../repository/comment.repository';
import PostRepository from '../repository/post.repository';
import UserService from './user.service';

@Service()
export default class PermissionService {
    constructor(
        @InjectRepository() private readonly postRepository: PostRepository,
        @InjectRepository() private readonly commentRepository: CommentRepository,
        @InjectRepository() private readonly collectionRepository: CollectionRepository,
        private readonly userService: UserService,
    ) { }

    async verifyUserAction(user: User, ownerId: string) {
        await this.verifyUser(user.id);
        await this.verifyUser(ownerId);

        if (user.role != UserRole.ADMIN && (user.role == UserRole.CONTRIBUTOR && user.id != ownerId)) {
            throw new PermissionDeniedException(user.id);
        }
    }

    async verifyPostAction(user: User, postId: string) {
        await this.verifyUser(user.id);

        const post = await this.postRepository.findOneWithCreator(postId);
        this.verifyPost(postId, post);

        if (user.role != UserRole.ADMIN && (user.role == UserRole.CONTRIBUTOR && user.id != post!.creator.id)) {
            throw new PermissionDeniedException(user.id);
        }
    }

    async verifyCollectionAction(user: User, collectionId: string) {
        await this.verifyUser(user.id);

        const collection = await this.collectionRepository.findOneWithCreator(collectionId);
        if (!collection || !collection.creator) {
            throw new UnprocessableEntityException(`Collection ${collectionId} does not exist or has no creator`);
        }

        if (user.role != UserRole.ADMIN && (user.role == UserRole.CONTRIBUTOR && user.id != collection.creator.id)) {
            throw new PermissionDeniedException(user.id);
        }
    }

    async verifyCommentCreateAction(user: User, postId: string) {
        await this.verifyUser(user.id);

        const post = await this.postRepository.findOneWithCreator(postId);
        this.verifyPost(postId, post);

        if (!post!.public) {
            if (user.role != UserRole.ADMIN && (user.role == UserRole.CONTRIBUTOR && user.id != post!.creator.id)) {
                throw new PermissionDeniedException(user.id);
            }
        }
    }

    async verifyCommentDeleteAction(user: User, commentId: string, postId: string) {
        await this.verifyUser(user.id);

        const post = await this.postRepository.findOneWithCreator(postId);
        this.verifyPost(postId, post);

        if (!post!.public) {
            if (user.role != UserRole.ADMIN && (user.role == UserRole.CONTRIBUTOR && user.id != post!.creator.id)) {
                throw new PermissionDeniedException(user.id);
            }
        }

        const comment = await this.commentRepository.findOneWithCreator(commentId);
        if (!comment || !comment.creator) {
            throw new UnprocessableEntityException(`Comment ${commentId} does not exist or has no creator`);
        }

        if (user.role != UserRole.ADMIN && (user.role == UserRole.CONTRIBUTOR &&
            (user.id != post!.creator.id && user.id != comment!.creator.id))) {
            throw new PermissionDeniedException(user.id);
        }
    }

    private async verifyUser(userId: string) {
        const user = await this.userService.getUserById(userId);
        if (!user) {
            throw new UnprocessableEntityException(`User ${userId} does not exist`);
        }
    }

    private verifyPost(postId: string, post?: Post) {
        if (!post || !post.creator) {
            throw new UnprocessableEntityException(`Post ${postId} does not exist or has no creator`);
        }
    }
}