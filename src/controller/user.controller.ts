import { NextFunction, Request, Response, Router } from 'express';
import { Service } from 'typedi';
import Controller from '../interfaces/controller.interface';
import Token from '../interfaces/token.interface';
import authMiddleware from '../middleware/auth.middleware';
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
        this.router.post(`${this.path}/logout`, authMiddleware, this.logout);
        this.router.post(this.path, requestValidationMiddleware(CreateUserDTO), this.register);
        this.router.put(`${this.path}/:id`, authMiddleware, requestValidationMiddleware(UpdateUserDTO), this.updateUser);
        this.router.delete(`${this.path}/:id`, authMiddleware, this.deleteUser);
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
            const userToken = await this.userService.authenticate(email, password);
            const cookie = this.createCookie(userToken.token);
            res.setHeader('Set-Cookie', [cookie]);
            res.status(200).json({ id: userToken.id });
        } catch (err) {
            next(err);
        }
    }

    private register = async (req: Request, res: Response, next: NextFunction) => {
        const email = req.body['email'];
        const password = req.body['password'];
        try {
            const userToken = await this.userService.createUser(email, password);
            const cookie = this.createCookie(userToken.token);
            res.setHeader('Set-Cookie', [cookie]);
            res.status(201).json({ id: userToken.id });
        } catch (err) {
            next(err);
        }
    }

    private logout = async (req: Request, res: Response) => {
        res.setHeader('Set-Cookie', ['Authorization=;Max-age=0']);
        res.sendStatus(204);
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

    private createCookie(token: Token) {
        return `Authorization=${token.token}; HttpOnly; Max-Age=${token.ttl}`;
    }
}