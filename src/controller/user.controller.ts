import { NextFunction, Request, Response, Router } from 'express';
import { Service } from 'typedi';
import Controller from '../interfaces/controller.interface';
import authenticationMiddleware from '../middleware/authentication.middleware';
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
        this.router.post(`${this.path}/:id/logout`, authenticationMiddleware, this.logout);
        this.router.post(this.path, requestValidationMiddleware(CreateUserDTO), this.register);
        this.router.put(`${this.path}/:id`, authenticationMiddleware, requestValidationMiddleware(UpdateUserDTO), this.updateUser);
        this.router.delete(`${this.path}/:id`, authenticationMiddleware, this.deleteUser);
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
            const token = userToken.token;
            res.cookie('Authorization', token.token, { maxAge: token.ttl * 1000 }).status(200).json({ id: userToken.id });
        } catch (err) {
            next(err);
        }
    }

    private register = async (req: Request, res: Response, next: NextFunction) => {
        const email = req.body['email'];
        const password = req.body['password'];
        try {
            const userToken = await this.userService.createUser(email, password);
            const token = userToken.token;
            res.cookie('Authorization', token.token, { maxAge: token.ttl * 1000 }).status(201).json({ id: userToken.id });
        } catch (err) {
            next(err);
        }
    }

    private logout = async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params.id;
        try {
            await this.userService.getUserById(id);
            res.clearCookie('Authorization').sendStatus(204);
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
        const count = req.query.count ? Number(req.query.count) : undefined;
        const withCover = req.query.withCover != undefined ? JSON.parse(req.query.withCover as string) : true;
        const publicOnly = req.query.publicOnly != undefined ? JSON.parse(req.query.publicOnly as string) : false;
        res.json(await this.postService.getPosts({ userId: userId, count: count, withCover: withCover, publicOnly: publicOnly }));
    }

    private getUserCollections = async (req: Request, res: Response) => {
        const id = req.params.id;
        res.json(await this.collectionService.getCollectionsByUser(id));
    }
}