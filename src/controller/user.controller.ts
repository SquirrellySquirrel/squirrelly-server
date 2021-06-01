import { NextFunction, Request, Response, Router } from 'express';
import { Service } from 'typedi';
import NotFoundException from '../exception/not-found.exception';
import UnauthorizedException from '../exception/unauthorized.exception';
import Controller from '../interfaces/controller.interface';
import requestValidationMiddleware from '../middleware/request-validation.middleware';
import CollectionService from '../service/collection.service';
import PostService from '../service/post.service';
import UserService from '../service/user.service';
import CreateUserDTO from './dto/create-user.dto';
import UpdateUserDTO from './dto/update-user.dto';
import UpgradeUserDTO from './dto/upgrade-user.dto';

const bcrypt = require('bcrypt');

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
        this.router.post(`${this.path}/authenticate`, this.authenticate);
        this.router.post(this.path, requestValidationMiddleware(CreateUserDTO), this.initUser);
        this.router.put(`${this.path}/:id/upgrade`, requestValidationMiddleware(UpgradeUserDTO), this.upgradeUser);
        this.router.put(`${this.path}/:id`, requestValidationMiddleware(UpdateUserDTO), this.updateUser);
        this.router.delete(`${this.path}/:id`, this.deleteUser);
    }

    private getUser = async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params.id;
        const user = await this.userService.getUserById(id);
        if (user) {
            res.json(user);
        } else {
            next(new NotFoundException('User', id));
        }
    }

    private authenticate = async (req: Request, res: Response, next: NextFunction) => {
        const email = req.body['email'];
        const userByEmail = await this.userService.getUserByEmail(email);
        if (userByEmail) {
            const password = req.body['password'];
            const isPasswordMatching = await bcrypt.compare(password, userByEmail.password);
            if (isPasswordMatching) {
                res.sendStatus(200);
            } else {
                next(new UnauthorizedException());
            }
        } else {
            next(new NotFoundException('User', email));
        }
    }

    private initUser = async (req: Request, res: Response, next: NextFunction) => {
        console.log("Init user: " + JSON.stringify(req.body));
        try {
            const user = await this.userService.createOrGetUser(req.body['deviceId'], req.body['systemName']);
            const userId = (({ id }) => ({ id }))(user);
            if (user.created) {
                res.status(201).json(userId);
            } else {
                res.status(200).json(userId);
            }
        } catch (err) {
            next(err);
        }
    }

    private upgradeUser = async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params.id;
        const userById = await this.userService.getUserById(id);
        if (!userById) {
            next(new NotFoundException('User', id));
        }

        const email = req.body['email'];
        const userByEmail = await this.userService.getUserByEmail(email);
        if (userByEmail) {
            res.status(409).json({ 'message': 'Email already exists' });
            return;
        }

        const password = req.body['password'];
        const hashedPassword = await bcrypt.hash(password, 10);

        let displayName = req.body['displayName'];
        if (!displayName) {
            displayName = email.split('@', 1)[0];
        }
        try {
            res.json(await this.userService.upgradeGhostUser(id, email, hashedPassword, displayName));
        } catch (err) {
            next(err);
        }
    }

    private updateUser = async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params.id;
        const user = await this.userService.getUserById(id);
        if (!user) {
            next(new NotFoundException('User', id));
        }

        const displayName = req.body['displayName'];
        try {
            res.json(await this.userService.updateUser(id, displayName));
        } catch (err) {
            next(err);
        }
    }

    private deleteUser = async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params.id;
        const user = await this.userService.getUserById(id);
        if (!user) {
            next(new NotFoundException('User', id));
            return;
        }

        try {
            await this.userService.deleteUser(id);
            res.sendStatus(204);
        } catch (err) {
            next(err);
        }
    }

    private getUserPosts = async (req: Request, res: Response) => {
        const id = req.params.id;
        res.json(await this.postService.getPostsByUser(id));
    }

    private getUserCollections = async (req: Request, res: Response) => {
        const id = req.params.id;
        res.json(await this.collectionService.getCollectionsByUser(id));
    }
}