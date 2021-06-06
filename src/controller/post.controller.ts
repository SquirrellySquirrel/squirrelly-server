import { NextFunction, Request, Response, Router } from 'express';
import fs from 'fs';
import multer from 'multer';
import { Service } from 'typedi';
import Photo from '../entity/photo';
import NotFoundException from '../exception/not-found.exception';
import Controller from '../interfaces/controller.interface';
import requestValidationMiddleware from '../middleware/request-validation.middleware';
import CommentService from '../service/comment.service';
import LocationService from '../service/location.service';
import PhotoService from '../service/photo.service';
import PostLikeService from '../service/post-like.service';
import PostService from '../service/post.service';
import CreateCommentDTO from './dto/create-comment.dto';

const photoDest = __dirname + '/images/';

const Storage = multer.diskStorage({
    destination(req, file, callback) {
        callback(null, photoDest)
    },
    filename(req, file, callback) {
        callback(null, `${file.fieldname}_${Date.now()}_${file.originalname}`)
    },
});

const upload = multer({ storage: Storage });

@Service()
export default class PostController implements Controller {
    public path = '/posts';
    public router = Router();

    constructor(
        private readonly postService: PostService,
        private readonly locationService: LocationService,
        private readonly commentService: CommentService,
        private readonly postLikeService: PostLikeService,
        private readonly photoService: PhotoService
    ) {
        this.initRoutes();
    }

    private initRoutes() {
        this.router.get(`${this.path}`, this.getPosts);
        this.router.get(`${this.path}/:id`, this.getPost);
        this.router.get(`${this.path}/:id/comments`, this.getPostComments);
        this.router.post(this.path, upload.array('photos', 5), this.createPost);
        this.router.post(`${this.path}/:id/comments`, requestValidationMiddleware(CreateCommentDTO), this.createComment);
        this.router.post(`${this.path}/:id/likes`, this.addLike);
        this.router.put(`${this.path}/:id`, upload.array('photos', 5), this.updatePost);
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
        const post = await this.postService.getPost(id);
        if (post) {
            res.json(post);
        } else {
            next(new NotFoundException('Post', id));
        }
    }

    private createPost = async (req: Request, res: Response, next: NextFunction) => {
        const files = req.files as Express.Multer.File[];
        try {
            const photos: Photo[] = []
            files.forEach((file, index) => {
                const photo = new Photo();
                photo.path = file['filename'];
                photo.type = file['type'] || file['mimetype'];
                photo.height = file['height'];
                photo.width = file['width'];
                photo.order = file['order'] || index;
                photos.push(photo);
            });

            res.status(201)
                .json(await this.postService.savePostAndLocation(
                    req.body['userId'],
                    JSON.parse(req.body['location']),
                    JSON.parse(req.body['isPublic']),
                    req.body['created'] as Date,
                    req.body['description'],
                    photos));
        } catch (err) {
            this.removeFiles(files.map(file => file['filename']));
            console.log("Removed photos due to failed post creation.");

            next(err);
        }
    }

    private updatePost = async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params.id;
        const post = await this.postService.getPost(id);
        if (!post) {
            next(new NotFoundException('Post', id));
            return;
        }

        const files = req.files as Express.Multer.File[];
        try {
            const photos: Photo[] = []
            files.forEach((file, index) => {
                const photo = new Photo();
                photo.id = file['id'];
                photo.path = file['filename'];
                photo.type = file['type'] || file['mimetype'];
                photo.height = file['height'];
                photo.width = file['width'];
                photo.order = file['order'] || index;
                photos.push(photo);
            });

            const oldLocationId = post.location.id;
            const oldPhotos = new Map(post.photos?.map(photo => [photo.id, photo.path]));

            const updatedPost = await this.postService.updatePostAndLocation(
                id,
                JSON.parse(req.body['location']),
                JSON.parse(req.body['isPublic']),
                req.body['created'],
                req.body['description'],
                photos);

            this.cleanupLocationFromDB(oldLocationId);
            this.cleanupPhotosFromDisk(oldPhotos);

            res.status(201).json(updatedPost);
        } catch (err) {
            this.removeFiles(files.map(file => file['filename']));
            console.log("Removed photos due to failed post update.");

            next(err);
        }
    }

    private async cleanupLocationFromDB(locationId: string) {
        if ((await this.postService.getPostsByLocation(locationId, false)).length == 0) {
            this.locationService.deleteLocation(locationId);
            console.log("Removed location: " + locationId);
        }
    }

    private async cleanupPhotosFromDisk(photos: Map<string, string>) {
        const photosToRemove = await this.photoService.identifyPhotosToRemove(photos);
        this.removeFiles(photosToRemove);
        console.log("Removed photos: \n" + photosToRemove.join('\n'));
    }

    private async removeFiles(filenames: string[]) {
        filenames.forEach(filename => {
            const path = photoDest + filename;
            fs.unlink(path, (err) => {
                if (err) {
                    console.error(err);
                    return;
                }
            });
        });
    }

    private deletePost = async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params.id;
        try {
            await this.postService.deletePost(id);
            res.sendStatus(204);
        } catch (err) {
            next(err);
        }
    }

    private getPostComments = async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params.id;
        const post = await this.postService.getPost(id);
        if (post) {
            res.json(post.comments)
        } else {
            next(new NotFoundException('Post', id));
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