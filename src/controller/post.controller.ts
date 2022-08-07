import { NextFunction, Request, Response, Router } from 'express';
import multer from 'multer';
import { Service } from 'typedi';
import { TMP_DIR } from '../config';
import Photo from '../entity/photo';
import HttpException from '../exception/http.exception';
import Controller from '../interfaces/controller.interface';
import authenticationMiddleware from '../middleware/authentication.middleware';
import cacheMiddleware from '../middleware/cache.middleware';
import requestValidationMiddleware from '../middleware/request-validation.middleware';
import userIdResolverMiddleware from '../middleware/user-id-resolver.middleware';
import CommentService from '../service/comment.service';
import PermissionService from '../service/permission.service';
import PhotoService from '../service/photo.service';
import PostLikeService from '../service/post-like.service';
import PostService from '../service/post.service';
import { putCache } from '../util/cache';
import { stringAsBoolean, stringAsNumber } from '../util/param-parser';
import CreateCommentDTO from './dto/create-comment.dto';
import CreatePostDTO from './dto/create-post.dto';
import UpdatePhotoDTO from './dto/update-photo.dto';
import UpdatePostDTO from './dto/update-post.dto';

const Storage = multer.diskStorage({
    destination(req, file, callback) {
        callback(null, TMP_DIR);
    },
    filename(req, file, callback) {
        callback(null, `${file.fieldname}_${Date.now()}_${file.originalname}`);
    },
});

const upload = multer({ storage: Storage });

@Service()
export default class PostController implements Controller {
    public path = '/posts';
    public router = Router();

    constructor(
        private readonly permissionService: PermissionService,
        private readonly postService: PostService,
        private readonly photoService: PhotoService,
        private readonly commentService: CommentService,
        private readonly postLikeService: PostLikeService,
    ) {
        this.initRoutes();
    }

    private initRoutes() {
        this.router.get(`${this.path}`, userIdResolverMiddleware, cacheMiddleware, this.getPosts)
            .get(`${this.path}/:id`, userIdResolverMiddleware, cacheMiddleware, this.getPost)
            .get(`${this.path}/:id/comments`, userIdResolverMiddleware, cacheMiddleware, this.getPostComments)
            .get(`${this.path}/:id/likes`, userIdResolverMiddleware, this.getPostLikes)
            .post(this.path, authenticationMiddleware, requestValidationMiddleware(CreatePostDTO), this.createPost)
            .post(`${this.path}/:id/photos`, authenticationMiddleware, upload.single('photo'), this.addPhoto)
            .post(`${this.path}/:id/comments`, authenticationMiddleware, requestValidationMiddleware(CreateCommentDTO), this.createComment)
            .post(`${this.path}/:id/likes`, authenticationMiddleware, this.addLike)
            .put(`${this.path}/:id`, authenticationMiddleware, requestValidationMiddleware(UpdatePostDTO), this.updatePost)
            .put(`${this.path}/:id/photos/:photoId`, authenticationMiddleware, requestValidationMiddleware(UpdatePhotoDTO), this.updatePhoto)
            .delete(`${this.path}/:id`, authenticationMiddleware, this.deletePost)
            .delete(`${this.path}/:id/photos/:photoId`, authenticationMiddleware, this.deletePhoto)
            .delete(`${this.path}/:id/comments/:commentId`, authenticationMiddleware, this.deleteComment)
            .delete(`${this.path}/:id/likes`, authenticationMiddleware, this.deleteLike);
    }

    private getPosts = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.query.userId as string | undefined;
            const locationId = req.query.locationId as string | undefined;
            const count = stringAsNumber(req.query.count as string | undefined);
            const withCover = stringAsBoolean(req.query.withCover as string | undefined, true);
            const publicOnly = stringAsBoolean(req.query.publicOnly as string | undefined, false);

            const posts = await this.postService.getPosts({ userId, locationId, count, withCover, publicOnly });
            if (!publicOnly) {
                posts.forEach((post) => {
                    this.permissionService.verifyPostReadAction(post.id, req.user);
                });
            }

            putCache(req.url, posts, 30);

            res.json(posts);
        } catch (err) {
            if (err instanceof SyntaxError) {
                next(new HttpException(400, 'Invalid request parameter'));
            }
            next(err);
        }
    }

    private getPost = async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params.id;
        try {
            await this.permissionService.verifyPostReadAction(id, req.user);

            const post = await this.postService.getPost(id);

            putCache(req.url, post, 30);

            res.json(post);
        } catch (err) {
            next(err);
        }
    }

    private createPost = async (req: Request, res: Response, next: NextFunction) => {
        const userId = req.body['userId'];
        try {
            await this.permissionService.verifyUserAction(req.user, userId);

            const postId = await this.postService.savePost(
                userId,
                req.body['location'],
                req.body['isPublic'],
                req.body['created'],
                req.body['description']);
            res.status(201).json(postId);
        } catch (err) {
            next(err);
        }
    }

    private addPhoto = async (req: Request, res: Response, next: NextFunction) => {
        const postId = req.params.id;
        const file = req.file;
        if (!file) {
            next(new HttpException(400, 'Photo file required but not provided'));
        } else {
            await this.permissionService.verifyOwnPostAction(req.user, postId);

            const photo = new Photo();
            photo.id = req.body['id'];
            photo.name = file['filename'];
            photo.type = file['mimetype'];
            photo.order = req.body['order'];
            try {
                const photoId = await this.photoService.addPhotoToPost(postId, photo);
                res.status(201).json(photoId);
            } catch (err) {
                next(err);
            }
        }
    }


    private updatePost = async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params.id;
        try {
            await this.permissionService.verifyOwnPostAction(req.user, id);

            await this.postService.updatePost(
                id,
                req.body['location'],
                req.body['isPublic'],
                req.body['created'],
                req.body['description'],
            );

            res.sendStatus(204);
        } catch (err) {
            next(err);
        }
    }

    private updatePhoto = async (req: Request, res: Response, next: NextFunction) => {
        const postId = req.params.postId;
        const photoId = req.params.photoId;
        const order = req.body['order'];
        try {
            await this.permissionService.verifyOwnPostAction(req.user, postId);

            await this.photoService.updatePhoto(postId, photoId, order);

            res.sendStatus(204);
        } catch (err) {
            next(err);
        }
    }

    private deletePhoto = async (req: Request, res: Response, next: NextFunction) => {
        const postId = req.params.id;
        const photoId = req.params.photoId;
        try {
            await this.permissionService.verifyOwnPostAction(req.user, postId);

            await this.photoService.deletePhoto(postId, photoId);

            res.sendStatus(204);
        } catch (err) {
            next(err);
        }
    }

    private deletePost = async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params.id;
        try {
            await this.permissionService.verifyOwnPostAction(req.user, id);

            await this.postService.deletePostAndPhotos(id);

            res.sendStatus(204);
        } catch (err) {
            next(err);
        }
    }

    private getPostComments = async (req: Request, res: Response, next: NextFunction) => {
        const postId = req.params.id;
        try {
            await this.permissionService.verifyPostReadAction(postId, req.user);

            const comments = await this.commentService.getComments(postId);

            putCache(req.url, comments, 30);

            res.json(comments);
        } catch (err) {
            next(err);
        }
    }

    private createComment = async (req: Request, res: Response, next: NextFunction) => {
        const postId = req.params.id;
        try {
            await this.permissionService.verifyAllPostAction(req.user, postId);

            res.status(201)
                .json(await this.commentService.addComment(postId, req.body['userId'], req.body['content']));
        } catch (err) {
            next(err);
        }
    }

    private deleteComment = async (req: Request, res: Response, next: NextFunction) => {
        const postId = req.params.id;
        const commentId = req.params.commentId;
        try {
            await this.permissionService.verifyCommentAction(req.user, commentId, postId);

            await this.commentService.deleteComment(commentId);
            res.sendStatus(204);
        } catch (err) {
            next(err);
        }
    }

    private getPostLikes = async (req: Request, res: Response, next: NextFunction) => {
        const postId = req.params.id;
        try {
            await this.permissionService.verifyPostReadAction(postId, req.user);

            res.json(await this.postLikeService.getPostLikes(postId));
        } catch (err) {
            next(err);
        }
    }

    private addLike = async (req: Request, res: Response, next: NextFunction) => {
        const postId = req.params.id;
        const userId = req.body['userId'];
        try {
            await this.permissionService.verifyOwnPostAction(req.user, postId);

            await this.postLikeService.addPostLike(postId, userId);
            res.sendStatus(201);
        } catch (err) {
            next(err);
        }
    }

    private deleteLike = async (req: Request, res: Response, next: NextFunction) => {
        const postId = req.params.id;
        const userId = req.body['userId'];
        try {
            this.permissionService.verifyUserAction(req.user, userId);

            await this.postLikeService.deletePostLike(postId, userId);
            res.sendStatus(204);
        } catch (err) {
            next(err);
        }
    }
}