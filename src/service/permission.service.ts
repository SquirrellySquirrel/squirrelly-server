import { Service } from 'typedi';
import { InjectRepository } from 'typeorm-typedi-extensions';
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

    verifyUserAction(user: User, ownerId: string) {
        this.verifyUser(user.id);
        this.verifyUser(ownerId);

        if (user.role == UserRole.ADMIN) {
            return;
        }
        if (user.role == UserRole.CONTRIBUTOR && user.id == ownerId) {
            return;
        }
        throw new PermissionDeniedException(user.id);
    }

    async verifyPostAction(user: User, postId: string) {
        this.verifyUser(user.id);

        const post = await this.postRepository.findOneWithCreator(postId);
        if (!post || !post.creator) {
            throw new UnprocessableEntityException('Post does not exist or has no creator');
        }

        if (user.role == UserRole.ADMIN) {
            return;
        }
        if (user.role == UserRole.CONTRIBUTOR && user.id == post.creator.id) {
            return;
        }
        throw new PermissionDeniedException(user.id);
    }

    async verifyCollectionAction(user: User, collectionId: string) {
        this.verifyUser(user.id);

        const collection = await this.collectionRepository.findOneWithCreator(collectionId);
        if (!collection || !collection.creator) {
            throw new UnprocessableEntityException('Collection does not exist or has no creator');
        }

        if (user.role == UserRole.ADMIN) {
            return;
        }
        if (user.role == UserRole.CONTRIBUTOR && user.id == collection.creator.id) {
            return;
        }
        throw new PermissionDeniedException(user.id);
    }

    async verifyCommentCreateAction(user: User, postId: string) {
        this.verifyUser(user.id);

        const post = await this.postRepository.findOne(postId);
        if (!post) {
            throw new UnprocessableEntityException('Post does not exist');
        }

        if (!post.public) {
            throw new PermissionDeniedException(user.id);
        }
    }

    async verifyCommentDeleteAction(user: User, commentId: string, postId: string) {
        this.verifyUser(user.id);

        const post = await this.postRepository.findOneWithCreator(postId);
        if (!post || !post.creator) {
            throw new UnprocessableEntityException('Post does not exist or has no creator');
        }

        if (!post.public) {
            throw new PermissionDeniedException(user.id);
        }

        if (user.role == UserRole.ADMIN || user.id == post.creator.id) {
            return;
        }

        const comment = await this.commentRepository.findOneWithCreator(commentId);
        if (!comment || !comment.creator) {
            throw new PermissionDeniedException(user.id);
        }

        if (user.role == UserRole.CONTRIBUTOR && user.id == comment.creator.id) {
            return;
        }
        throw new PermissionDeniedException(user.id);
    }

    private async verifyUser(userId: string) {
        const user = await this.userService.getUserById(userId);
        if (!user) {
            throw new UnprocessableEntityException('User does not exist');
        }
    }
}