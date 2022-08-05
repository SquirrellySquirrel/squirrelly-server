import { Service } from 'typedi';
import { InjectRepository } from 'typeorm-typedi-extensions';
import Collection from '../entity/collection';
import Comment from '../entity/comment';
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
    async verifyPostReadAction(postId: string, user?: User) {
        const post = await this.postRepository.findOneWithCreator(postId);
        this.verifyPost(postId, post);

        if (!post!.public) {
            if (!user) {
                throw new PermissionDeniedException();
            }

            this.verifyUserOwnership(user, post!.creator.id);
        }
    }

    /**
     * Verify if a user can perform actions on a post
     */
    async verifyPostAction(user: User, postId: string) {
        const post = await this.postRepository.findOneWithCreator(postId);
        this.verifyPost(postId, post);
        this.verifyUserOwnership(user, post!.creator.id);
    }

    /**
     * Verify if a user can perform actions on a collection
     */
    async verifyCollectionAction(user: User, collectionId: string) {
        const collection = await this.collectionRepository.findOneWithCreator(collectionId);
        this.verifyCollection(collectionId, collection);
        this.verifyUserOwnership(user, collection!.creator.id);
    }

    /**
    * Verify if a user can create a comment
    */
    async verifyCommentCreateAction(user: User, postId: string) {
        const post = await this.postRepository.findOneWithCreator(postId);
        this.verifyPost(postId, post);

        if (!post!.public) {
            this.verifyUserOwnership(user, post!.creator.id);
        }
    }

    /**
    * Verify if a user can delete a comment
    */
    async verifyCommentDeleteAction(user: User, commentId: string, postId: string) {
        const post = await this.postRepository.findOneWithCreator(postId);
        this.verifyPost(postId, post);

        if (!post!.public) {
            this.verifyUserOwnership(user, post!.creator.id);
        }

        const comment = await this.commentRepository.findOneWithCreator(commentId);
        this.verifyComment(commentId, comment);

        if (user.role == UserRole.ADMIN) return;
        if (user.role == UserRole.CONTRIBUTOR && (user.id == post!.creator.id || user.id == comment!.creator.id)) return;

        throw new PermissionDeniedException(user.id);
    }

    private verifyPost(postId: string, post?: Post) {
        if (!post) {
            throw new UnprocessableEntityException(`Post ${postId} does not exist`);
        }

        if (!post.creator) {
            throw new UnprocessableEntityException(`Post ${postId} has no creator - something was broken!`);
        }
    }

    private verifyComment(commentId: string, comment?: Comment) {
        if (!comment) {
            throw new UnprocessableEntityException(`Comment ${commentId} does not exist`);
        }

        if (!comment.creator) {
            throw new UnprocessableEntityException(`Comment ${commentId} has no creator - something was broken!`);
        }
    }

    private verifyCollection(collectionId: string, collection?: Collection) {
        if (!collection) {
            throw new UnprocessableEntityException(`Collection ${collectionId} does not exist`);
        }

        if (!collection.creator) {
            throw new UnprocessableEntityException(`Collection ${collectionId} has no creator - something was broken!`);
        }
    }

    private verifyUserOwnership(user: User, ownerId: string) {
        if (user.role == UserRole.ADMIN || (user.role == UserRole.CONTRIBUTOR && user.id == ownerId)) {
            return;
        }

        throw new PermissionDeniedException(user.id);
    }
}