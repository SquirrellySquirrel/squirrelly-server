import { Collection, Comment, Post, User } from '@prisma/client';
import { Inject, Service } from 'typedi';
import CollectionDao from '../db/dao/collection.dao';
import CommentDao from '../db/dao/comment.dao';
import PostDao from '../db/dao/post.dao';
import PermissionDeniedException from '../exception/permission-denied.exception';
import UnprocessableEntityException from '../exception/unprocessable-entity.exception';
import { UserRole } from './model/user';
import UserService from './user.service';

@Service()
export default class PermissionService {
    constructor(
        @Inject() private readonly postDao: PostDao,
        @Inject() private readonly commentDao: CommentDao,
        @Inject() private readonly collectionDao: CollectionDao,
        @Inject() private readonly userService: UserService,
    ) { }

    /**
     * Verify if a user can perform actions on an entity with ownership
     */
    async verifyUserAction(user: User, ownerId: string) {
        const owner = await this.userService.getUserById(ownerId);
        if (!owner) {
            throw new UnprocessableEntityException(`User ${ownerId} does not exist`);
        }

        this.verifyUserOwnership(user, owner.id);
    }

    /**
     * Verify if a post is accessible to any user based on its visibility
     */
    async verifyPostReadAction(postId: string, user: User | null) {
        const post = await this.postDao.findById(postId);
        this.verifyPost(postId, post);

        if (!post!.public) {
            if (!user) {
                throw new PermissionDeniedException();
            }

            this.verifyUserOwnership(user, post!.creatorId);
        }
    }

    /**
     * Verify if a user can perform actions on a post (either admin or post creator)
     */
    async verifyOwnPostAction(user: User, postId: string) {
        const post = await this.postDao.findById(postId);
        this.verifyPost(postId, post);
        this.verifyUserOwnership(user, post!.creatorId);
    }

    /**
     * Verify if a user can perform actions on a public post (any user) or a private post (either admin or post creator)
     */
    async verifyAllPostAction(user: User, postId: string) {
        const post = await this.postDao.findById(postId);
        this.verifyPost(postId, post);

        if (!post!.public) {
            this.verifyUserOwnership(user, post!.creatorId);
        }
    }

    /**
     * Verify if a user can perform actions on a collection (either admin or collection creator)
     */
    async verifyCollectionAction(user: User, collectionId: string) {
        const collection = await this.collectionDao.findById(collectionId);
        this.verifyCollection(collectionId, collection);
        this.verifyUserOwnership(user, collection!.creatorId);
    }

    /**
    * Verify if a user can perform actions on a comment of a public post (admin, post creator or comment creator)
    * or a private post (admin, post creator)
    */
    async verifyCommentAction(user: User, commentId: string, postId: string) {
        const post = await this.postDao.findById(postId);
        this.verifyPost(postId, post);

        if (!post!.public) {
            this.verifyUserOwnership(user, post!.creatorId);
        }

        const comment = await this.commentDao.findById(commentId);
        this.verifyComment(commentId, comment);

        if (user.role == UserRole.ADMIN) return;
        if (user.role == UserRole.USER && (user.id == post!.creatorId || user.id == comment!.creatorId)) return;

        throw new PermissionDeniedException(user.id);
    }

    private verifyPost(postId: string, post: Post | null) {
        if (!post) {
            throw new UnprocessableEntityException(`Post ${postId} does not exist`);
        }

        if (!post.creatorId) {
            throw new UnprocessableEntityException(`Post ${postId} has no creator - something was broken!`);
        }
    }

    private verifyComment(commentId: string, comment: Comment | null) {
        if (!comment) {
            throw new UnprocessableEntityException(`Comment ${commentId} does not exist`);
        }

        if (!comment.creatorId) {
            throw new UnprocessableEntityException(`Comment ${commentId} has no creator - something was broken!`);
        }
    }

    private verifyCollection(collectionId: string, collection: Collection | null) {
        if (!collection) {
            throw new UnprocessableEntityException(`Collection ${collectionId} does not exist`);
        }

        if (!collection.creatorId) {
            throw new UnprocessableEntityException(`Collection ${collectionId} has no creator - something was broken!`);
        }
    }

    private verifyUserOwnership(user: User, ownerId: string) {
        if (user.role == UserRole.ADMIN || (user.role == UserRole.USER && user.id == ownerId)) {
            return;
        }

        throw new PermissionDeniedException(user.id);
    }
}