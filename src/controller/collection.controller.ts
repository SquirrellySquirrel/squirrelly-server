import { NextFunction, Request, Response, Router } from 'express';
import { Service } from 'typedi';
import NotFoundException from '../exception/not-found.exception';
import Controller from '../interfaces/controller.interface';
import requestValidationMiddleware from '../middleware/request-validation.middleware';
import CollectionService from '../service/collection.service';
import PostService from '../service/post.service';
import UserService from '../service/user.service';
import CreateCollectionDTO from './dto/create-collection.dto';
import UpdateCollectionDTO from './dto/update-collection.dto';

@Service()
export default class CollectionController implements Controller {
    public path = '/collections';
    public router = Router();

    constructor(private readonly collectionService: CollectionService,
        private readonly postService: PostService,
        private readonly userService: UserService) {
        this.initRoutes();
    }

    private initRoutes() {
        this.router.get(`${this.path}/:id`, this.getCollection);
        this.router.post(this.path, requestValidationMiddleware(CreateCollectionDTO), this.createCollection);
        this.router.put(`${this.path}/:id`, requestValidationMiddleware(UpdateCollectionDTO), this.updateCollection);
        this.router.delete(`${this.path}/:id`, this.deleteCollection);
    }

    private getCollection = async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params.id;
        const post = await this.collectionService.getCollection(id);
        if (post) {
            res.send(post);
        } else {
            next(new NotFoundException('Collection', id));
        }
    }

    private createCollection = async (req: Request, res: Response, next: NextFunction) => {
        const postIds = req.body['postIds'] as string[];
        postIds.forEach(async id => {
            if (!(await this.postService.getPost(id))) {
                next(new NotFoundException('Post', id));
            }
        });
        const userId = req.body['userId'];
        if (!(await this.userService.getUserById(userId))) {
            next(new NotFoundException('User', userId));
        }
        const name = req.body['name'];
        const descrption = req.body['description'];
        res.status(201)
            .send(await this.collectionService.createCollection(postIds, userId, { name: name, description: descrption }));
    }

    private updateCollection = async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params.id;
        const postIds = req.body['postIds'] as string[];
        postIds.forEach(async id => {
            if (!(await this.postService.getPost(id))) {
                next(new NotFoundException('Post', id));
            }
        });
        const name = req.body['name'];
        const descrption = req.body['description'];
        res.send(await this.collectionService.updateCollection(id, postIds, { name: name, description: descrption }));
    }

    private deleteCollection = async (req: Request, res: Response) => {
        const id = req.params.id;
        await this.collectionService.deleteCollection(id);
        res.sendStatus(204);
    }

}