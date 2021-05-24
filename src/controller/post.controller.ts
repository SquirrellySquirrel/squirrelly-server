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
import PostLikeService from '../service/post-like.service';
import PostService from '../service/post.service';
import CreateCommentDTO from './dto/create-comment.dto';


const Storage = multer.diskStorage({
    destination(req, file, callback) {
        callback(null, __dirname + '/images')
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
        private readonly postLikeService: PostLikeService
    ) {
        this.initRoutes();
    }

    private initRoutes() {
        this.router.get(`${this.path}/:id`, this.getPost);
        this.router.get(`${this.path}/:id/comments`, this.getPostComments);
        this.router.post(this.path, upload.array('photos', 5), this.createPost);
        this.router.post(`${this.path}/:id/comments`, requestValidationMiddleware(CreateCommentDTO), this.createComment);
        this.router.post(`${this.path}/:id/likes`, this.addLike);
        this.router.put(`${this.path}/:id`, this.updatePost);
        this.router.delete(`${this.path}/:id`, this.deletePost);
        this.router.delete(`${this.path}/:id/comments/:commentId`, this.deleteComment);
        this.router.delete(`${this.path}/:id/likes`, this.deleteLike);
    }

    private getPost = async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params.id;
        const post = await this.postService.getPost(id);
        if (post) {
            res.send(post);
        } else {
            next(new NotFoundException('Post', id));
        }
    }

    private createPost = async (req: Request, res: Response, next: NextFunction) => {
        const files = req.files as Express.Multer.File[];
        const photos: Photo[] = []
        files.forEach(file => {
            const photo = new Photo();
            photo.path = file['path'];
            photo.type = file['type'];
            photo.height = file['height'];
            photo.width = file['width'];
            photo.order = file['order'];
            photos.push(photo);
        });

        const location = JSON.parse(req.body['location']);
        const existingLocation = await this.locationService.getLocationByCoordinate(location.latitude, location.longitude);
        const locationId = existingLocation ? existingLocation.id : (await this.locationService.saveLocation(location)).id
        console.log("Location: " + locationId);

        try {
            res.status(201)
                .send(await this.postService.savePost(
                    req.body['userId'],
                    locationId,
                    req.body['isPublic'],
                    req.body['created'],
                    photos));
        } catch (err) {
            this.removeFiles(files);
            console.log("Removed photos due to failed post creation.");

            next(err);
        }
    }

    private updatePost = async (req: Request, res: Response, next: NextFunction) => {
        const files = req.files as Express.Multer.File[];
        const photos: Photo[] = []
        files.forEach(file => {
            const photo = new Photo();
            photo.id = file['id'];
            photo.path = file['path'];
            photo.type = file['type'];
            photo.height = file['height'];
            photo.width = file['width'];
            photo.order = file['order'];
            photos.push(photo);
        });

        const location = JSON.parse(req.body['location']);

        try {
            const existingLocation = await this.locationService.getLocationByCoordinate(location.latitude, location.longitude);
            if (!existingLocation) {
                const locationId = (await this.locationService.saveLocation(location)).id;

                res.status(201)
                    .send(await this.postService.savePost(
                        req.body['userId'],
                        locationId,
                        req.body['isPublic'],
                        req.body['created'],
                        photos));
            } else {
                res.status(201)
                    .send(await this.postService.savePost(
                        req.body['userId'],
                        existingLocation.id,
                        req.body['isPublic'],
                        req.body['created'],
                        photos));
            }
        } catch (err) {
            this.removeFiles(files);
            console.log("Removed photos due to failed post update.");

            next(err);
        }
        // TODO: delete location if not used by any posts
    }

    private removeFiles(files: Express.Multer.File[]) {
        files.forEach(file => {
            fs.unlink(file['path'], (err) => {
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
            res.send(post.comments)
        } else {
            next(new NotFoundException('Post', id));
        }
    }

    private createComment = async (req: Request, res: Response, next: NextFunction) => {
        const postId = req.params.id;
        try {
            res.status(201)
                .send(await this.commentService.addComment(postId, req.body['userId'], req.body['content']));
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
                .send(await this.postLikeService.addPostLike(req.params.id, req.body['userId']));
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