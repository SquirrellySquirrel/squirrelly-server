import { NextFunction, Request, Response, Router } from 'express';
import { Service } from 'typedi';
import NotFoundException from '../exception/not-found.exception';
import Controller from '../interfaces/controller.interface';
import CollectionService from '../service/collection.service';
import PostService from '../service/post.service';
import UserService from '../service/user.service';

@Service()
export default class UserController implements Controller {
    public path = '/users';
    public router = Router();

    constructor(
        private readonly userService: UserService,
        private readonly postService: PostService,
        private readonly collectionService: CollectionService) {
        this.initRoutes();
    }

    private initRoutes() {
        this.router.get(`${this.path}/:id`, this.getUser);
        this.router.get(`${this.path}/:id/posts`, this.getUserPosts);
        this.router.get(`${this.path}/:id/collections`, this.getUserCollections);
        this.router.post(this.path, this.createUser);
        this.router.put(`${this.path}/:id`, this.updateUser);
        this.router.delete(`${this.path}/:id`, this.deleteUser);
    }

    private getUser = async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params.id;
        const user = await this.userService.getUser(id);
        if (user) {
            res.send(user);
        } else {
            next(new NotFoundException('User', id));
        }
    }

    private createUser = async (req: Request, res: Response) => {
        res.status(201)
            .send(await this.userService.createGhostUser(req.body['device_id'], req.body['device_type']));
    }

    private updateUser = async (req: Request, res: Response) => {
        const id = req.params.id;
        const email = req.body['email'];
        const password = req.body['password'];
        const displayName = req.body['display_name'];
        if (email && password) {
            res.send(await this.userService.upgradeGhostUser(id, email, password, displayName));
        } else {
            res.send(await this.userService.updateUser(id, displayName));
        }
    }

    private deleteUser = async (req: Request, res: Response) => {
        const id = req.params.id;
        await this.userService.deleteUser(id);
        res.sendStatus(204);
    }

    private getUserPosts = async (req: Request, res: Response) => {
        const id = req.params.id;
        res.send(await this.postService.getPostsByUser(id));
    }

    private getUserCollections = async (req: Request, res: Response) => {
        const id = req.params.id;
        res.send(await this.collectionService.getCollectionsByUser(id));
    }
}