import { NextFunction, Request, Response, Router } from 'express';
import multer from 'multer';
import { Service } from 'typedi';
import Location from '../entity/location';
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
        console.log(__dirname + '/images');

        callback(null, __dirname + '/images')
    },
    // add back file extensions
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

    private createPost = async (req: Request, res: Response) => {
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
        const locationToSave: Partial<Location> = {
            latitude: location.latitude,
            longitude: location.longitude,
            address: location.address
        };
        const locationId = (await this.locationService.saveLocation(location)).id;

        res.status(201)
            .send(await this.postService.savePost(
                req.body['userId'],
                { id: locationId, ...locationToSave } as Location,
                req.body['isPublic'],
                req.body['created'],
                photos));
        // TODO: delete photos if saving post failed
    }

    private updatePost = async (req: Request, res: Response) => {
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
        const existingLocation = await this.locationService.getLocationByCoordinate(location.latitude, location.longitude);
        if (!existingLocation) {
            const locationToSave: Partial<Location> = {
                latitude: location.latitude,
                longitude: location.longitude,
                address: location.address
            };
            const locationId = (await this.locationService.saveLocation(location)).id;

            res.status(201)
                .send(await this.postService.savePost(
                    req.body['userId'],
                    { id: locationId, ...locationToSave } as Location,
                    req.body['isPublic'],
                    req.body['created'],
                    photos));
        } else {
            res.status(201)
                .send(await this.postService.savePost(
                    req.body['userId'],
                    existingLocation,
                    req.body['isPublic'],
                    req.body['created'],
                    photos));
        }

        // TODO: delete photos if saving post failed
        // TODO: delete location if not used by any posts
    }

    private deletePost = async (req: Request, res: Response) => {
        const id = req.params.id;
        await this.postService.deletePost(id);
        res.sendStatus(204);
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

    private createComment = async (req: Request, res: Response) => {
        const postId = req.params.id;
        res.status(201)
            .send(await this.commentService.addComment(postId, req.body['userId'], req.body['content']));
    }

    private deleteComment = async (req: Request, res: Response) => {
        await this.commentService.deleteComment(req.params.commentId);
        res.sendStatus(204);
    }

    private addLike = async (req: Request, res: Response) => {
        res.status(201)
            .send(await this.postLikeService.addPostLike(req.params.id, req.body['userId']));
    }

    private deleteLike = async (req: Request, res: Response) => {
        await this.postLikeService.deletePostLike(req.params.id, req.body['userId']);
        res.sendStatus(204);
    }

}