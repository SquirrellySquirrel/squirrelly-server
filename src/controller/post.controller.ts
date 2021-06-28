import { NextFunction, Request, Response, Router } from 'express';
import multer from 'multer';
import { Service } from 'typedi';
import Photo from '../entity/photo';
import Controller from '../interfaces/controller.interface';
import cleanupMiddleware from '../middleware/cleanup.middleware';
import requestValidationMiddleware from '../middleware/request-validation.middleware';
import CommentService from '../service/comment.service';
import PostLikeService from '../service/post-like.service';
import PostService from '../service/post.service';
import CreateCommentDTO from './dto/create-comment.dto';

const tmpDir = process.env.TMP_DIR as string;

const Storage = multer.diskStorage({
    destination(req, file, callback) {
        callback(null, tmpDir);
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
        private readonly commentService: CommentService,
        private readonly postLikeService: PostLikeService
    ) {
        this.initRoutes();
    }

    private initRoutes() {
        this.router.get(`${this.path}`, this.getPosts);
        this.router.get(`${this.path}/:id`, this.getPost);
        this.router.get(`${this.path}/:id/comments`, this.getPostComments);
        this.router.post(this.path, upload.array('photos', 5), this.createPost, cleanupMiddleware);
        this.router.post(`${this.path}/:id/comments`, requestValidationMiddleware(CreateCommentDTO), this.createComment);
        this.router.post(`${this.path}/:id/likes`, this.addLike);
        this.router.put(`${this.path}/:id`, upload.array('photos', 5), this.updatePost, cleanupMiddleware);
        this.router.delete(`${this.path}/:id`, this.deletePost);
        this.router.delete(`${this.path}/:id/comments/:commentId`, this.deleteComment);
        this.router.delete(`${this.path}/:id/likes`, this.deleteLike);
    }

    private getPosts = async (req: Request, res: Response) => {
        const userId = req.query.userId as string;
        const count = req.query.count as string;
        res.json(await this.postService.getPostsByUser(userId, Number(count)));
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
        const files = req.files as Express.Multer.File[];
        try {
            const postId = await this.postService.createPostAndPhotos(
                req.body['userId'],
                JSON.parse(req.body['location']),
                JSON.parse(req.body['isPublic']),
                req.body['created'] as Date,
                req.body['description'],
                this.convertFilesToPhotos(files));

            res.status(201).json(postId);
        } catch (err) {
            next(err);
        }
    }

    private updatePost = async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params.id;
        const files = req.files as Express.Multer.File[];
        try {
            await this.postService.updatePostAndPhotos(
                id,
                JSON.parse(req.body['location']),
                JSON.parse(req.body['isPublic']),
                req.body['created'],
                req.body['description'],
                this.convertFilesToPhotos(files));

            res.sendStatus(204);
        } catch (err) {
            next(err);
        }
    }

    private convertFilesToPhotos(files: Express.Multer.File[]): Photo[] {
        const photos: Photo[] = [];
        files.forEach((file, index) => {
            const photo = new Photo();
            photo.id = file['id'];
            photo.path = file['name'];
            photo.type = file['type'];
            photo.height = file['height'];
            photo.width = file['width'];
            photo.order = index;
            photos.push(photo);
        });
        return photos;
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