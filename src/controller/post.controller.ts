import { NextFunction, Request, Response, Router } from 'express';
import multer from 'multer';
import { Service } from 'typedi';
import { TMP_DIR } from '../config';
import Photo from '../entity/photo';
import Controller from '../interfaces/controller.interface';
import cleanupMiddleware from '../middleware/cleanup.middleware';
import requestValidationMiddleware from '../middleware/request-validation.middleware';
import CommentService from '../service/comment.service';
import PhotoService from '../service/photo.service';
import PostLikeService from '../service/post-like.service';
import PostService from '../service/post.service';
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
        private readonly postService: PostService,
        private readonly photoService: PhotoService,
        private readonly commentService: CommentService,
        private readonly postLikeService: PostLikeService,
    ) {
        this.initRoutes();
    }

    private initRoutes() {
        this.router.get(`${this.path}`, this.getPosts);
        this.router.get(`${this.path}/:id`, this.getPost);
        this.router.get(`${this.path}/:id/comments`, this.getPostComments);
        this.router.post(this.path, requestValidationMiddleware(CreatePostDTO), this.createPost);
        this.router.post(`${this.path}/:id/photos`, upload.single('photo'), this.addPhoto, cleanupMiddleware);
        this.router.post(`${this.path}/:id/comments`, requestValidationMiddleware(CreateCommentDTO), this.createComment);
        this.router.post(`${this.path}/:id/likes`, this.addLike);
        this.router.put(`${this.path}/:id`, requestValidationMiddleware(UpdatePostDTO), this.updatePost);
        this.router.put(`${this.path}/:id/photos/:photoId`, requestValidationMiddleware(UpdatePhotoDTO), this.updatePhoto);
        this.router.delete(`${this.path}/:id`, this.deletePost);
        this.router.delete(`${this.path}/:id/photos/:photoId`, this.deletePhoto);
        this.router.delete(`${this.path}/:id/comments/:commentId`, this.deleteComment);
        this.router.delete(`${this.path}/:id/likes`, this.deleteLike);
    }

    private getPosts = async (req: Request, res: Response) => {
        const userId = req.query.userId?.toString();
        const locationId = req.query.locationId?.toString();
        const count = req.query.count;
        res.json(await this.postService.getPosts(userId, locationId, (count ? Number(count) : undefined)));
    }

    private getPost = async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params.id;
        try {
            const post = await this.postService.getPost(id);
            res.json(post);
        } catch (err) {
            next(err);
        }
    }

    private createPost = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const postId = await this.postService.savePost(
                req.body['userId'],
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
        const photo = new Photo();
        photo.id = req.body['id'];
        photo.path = file['filename'];
        photo.type = file['mimetype'];
        photo.order = req.body['order'];
        try {
            const photoId = await this.photoService.addPhotoToPost(postId, photo);

            res.status(201).json(photoId);
        } catch (err) {
            next(err);
        }
    }

    private updatePhoto = async (req: Request, res: Response, next: NextFunction) => {
        const photoId = req.params.photoId;
        const order = req.body['order'];
        try {
            await this.photoService.updatePhoto(photoId, order);

            res.sendStatus(204);
        } catch (err) {
            next(err);
        }
    }

    private updatePost = async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params.id;
        try {
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

    private deletePost = async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params.id;
        try {
            await this.postService.deletePostAndPhotos(id);

            res.sendStatus(204);
        } catch (err) {
            next(err);
        }
    }

    private deletePhoto = async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params.photoId;
        try {
            await this.photoService.deletePhoto(id);

            res.sendStatus(204);
        } catch (err) {
            next(err);
        }
    }

    private getPostComments = async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params.id;
        try {
            const post = await this.postService.getPost(id);
            res.json(post.comments);
        } catch (err) {
            next(err);
        }
    }

    private createComment = async (req: Request, res: Response, next: NextFunction) => {
        const postId = req.params.id;
        try {
            res.status(201)
                .json(await this.commentService.addComment(postId, req.body['userId'], req.body['content']));
        } catch (err) {
            next(err);
        }
    }

    private deleteComment = async (req: Request, res: Response, next: NextFunction) => {
        await this.commentService.deleteComment(req.params.commentId);
        try {
            res.sendStatus(204);
        } catch (err) {
            next(err);
        }
    }

    private addLike = async (req: Request, res: Response, next: NextFunction) => {
        try {
            res.status(201)
                .json(await this.postLikeService.addPostLike(req.params.id, req.body['userId']));
        } catch (err) {
            next(err);
        }
    }

    private deleteLike = async (req: Request, res: Response, next: NextFunction) => {
        try {
            await this.postLikeService.deletePostLike(req.params.id, req.body['userId']);
            res.sendStatus(204);
        } catch (err) {
            next(err);
        }
    }
}