import { NextFunction, Request, Response, Router } from 'express';
import multer from 'multer';
import { Service } from 'typedi';
import Location from '../entity/location';
import Photo from '../entity/photo';
import NotFoundException from '../exception/not-found.exception';
import Controller from '../interfaces/controller.interface';
import CommentService from '../service/comment.service';
import LocationService from '../service/location.service';
import PostService from '../service/post.service';

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
        private readonly commentService: CommentService
    ) {
        this.initRoutes();
    }

    private initRoutes() {
        this.router.get(`${this.path}/:id`, this.getPost);
        this.router.get(`${this.path}/:id/comments`, this.getPostComments);
        this.router.post(this.path, upload.array('photos', 5), this.createPost);
        this.router.post(`${this.path}/:id/comments`, this.createComment);
        this.router.put(`${this.path}/:id`, this.updatePost);
        this.router.delete(`${this.path}/:id`, this.deletePost);
        this.router.delete(`${this.path}/:id/comments/:commentId`, this.deleteComment);
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
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const photo = new Photo();
            photo.path = file['path'];
            photo.type = file['mimetype'];
            photo.height = file['height'];
            photo.width = file['width'];
            photo.order = i;
            photos.push(photo);
        }

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
    }

    private deleteComment = async (req: Request, res: Response) => {
    }

}