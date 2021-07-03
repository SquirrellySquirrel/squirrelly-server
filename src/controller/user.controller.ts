import { NextFunction, Request, Response, Router } from 'express';
import { Service } from 'typedi';
import Controller from '../interfaces/controller.interface';
import requestValidationMiddleware from '../middleware/request-validation.middleware';
import CollectionService from '../service/collection.service';
import PostService from '../service/post.service';
import UserService from '../service/user.service';
import CreateUserDTO from './dto/create-user.dto';
import UpdateUserDTO from './dto/update-user.dto';

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
        this.router.post(`${this.path}/login`, this.login);
        this.router.post(this.path, requestValidationMiddleware(CreateUserDTO), this.register);
        this.router.put(`${this.path}/:id`, requestValidationMiddleware(UpdateUserDTO), this.updateUser);
        this.router.delete(`${this.path}/:id`, this.deleteUser);
    }

    private getUser = async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params.id;
        try {
            const user = await this.userService.getUserById(id);
            res.json(user);
        } catch (err) {
            next(err);
        }
    }

    private login = async (req: Request, res: Response, next: NextFunction) => {
        const email = req.body['email'];
        const password = req.body['password'];
        try {
            const userId = await this.userService.authenticate(email, password);
            res.status(200).json(userId);
        } catch (err) {
            next(err);
        }
    }

    private register = async (req: Request, res: Response, next: NextFunction) => {
        const email = req.body['email'];
        const password = req.body['password'];
        try {
            const userId = await this.userService.createUser(email, password);
            res.status(201).json(userId);
        } catch (err) {
            next(err);
        }
    }

    private updateUser = async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params.id;
        const displayName = req.body['displayName'];
        try {
            await this.userService.updateUser(id, displayName);
            res.sendStatus(204);
        } catch (err) {
            next(err);
        }
    }

    private deleteUser = async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params.id;
        try {
            await this.userService.deleteUser(id);
            res.sendStatus(204);
        } catch (err) {
            next(err);
        }
    }

    private getUserPosts = async (req: Request, res: Response) => {
        const userId = req.params.id;
        res.json(await this.postService.getPosts(userId));
    }

    private getUserCollections = async (req: Request, res: Response) => {
        const id = req.params.id;
        res.json(await this.collectionService.getCollectionsByUser(id));
    }
}