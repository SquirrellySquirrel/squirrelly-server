import { NextFunction, Request, Response, Router } from 'express';
import { Service } from 'typedi';
import HttpException from '../exception/http.exception';
import Controller from '../interfaces/controller.interface';
import authenticationMiddleware from '../middleware/authentication.middleware';
import requestValidationMiddleware from '../middleware/request-validation.middleware';
import userIdResolverMiddleware from '../middleware/user-id-resolver.middleware';
import CollectionService from '../service/collection.service';
import PermissionService from '../service/permission.service';
import PostService from '../service/post.service';
import UserService from '../service/user.service';
import { putCache } from '../util/cache';
import { stringAsBoolean, stringAsNumber } from '../util/param-parser';
import CreateUserDTO from './dto/create-user.dto';
import UpdateUserDTO from './dto/update-user.dto';

@Service()
export default class UserController implements Controller {
    public path = '/users';
    public router = Router();

    constructor(
        private readonly permissionService: PermissionService,
        private readonly userService: UserService,
        private readonly postService: PostService,
        private readonly collectionService: CollectionService) {
        this.initRoutes();
    }

    private initRoutes() {
        this.router.get(`${this.path}/:id`, this.getUser);
        this.router.get(`${this.path}/:id/posts`, userIdResolverMiddleware, this.getUserPosts);
        this.router.get(`${this.path}/:id/collections`, userIdResolverMiddleware, this.getUserCollections);
        this.router.post(`${this.path}/login`, this.login);
        this.router.post(`${this.path}/:id/logout`, authenticationMiddleware, this.logout);
        this.router.post(this.path, requestValidationMiddleware(CreateUserDTO), this.register);
        this.router.put(`${this.path}/:id`, authenticationMiddleware, requestValidationMiddleware(UpdateUserDTO), this.updateUser);
        this.router.delete(`${this.path}/:id`, authenticationMiddleware, this.deleteUser);
    }

    private getUser = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = await this.userService.getUserByIdOrEmail(req.params.id);
            res.json(user);
        } catch (err) {
            next(err);
        }
    }

    private login = async (req: Request, res: Response, next: NextFunction) => {
        const email = req.body['email'];
        const password = req.body['password'];
        try {
            const userToken = await this.userService.authenticate({ email, password });
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
            const userToken = await this.userService.createUser({ email, password });
            const token = userToken.token;
            res.cookie('Authorization', token.token, { maxAge: token.ttl * 1000 }).status(201).json({ id: userToken.id });
        } catch (err) {
            next(err);
        }
    }

    private logout = async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params.id;
        try {
            await this.permissionService.verifyUserAction(req.user, id);

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
            await this.permissionService.verifyUserAction(req.user, id);

            await this.userService.updateUser(id, displayName);
            res.sendStatus(204);
        } catch (err) {
            next(err);
        }
    }

    private deleteUser = async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params.id;
        try {
            await this.permissionService.verifyUserAction(req.user, id);

            await this.userService.deleteUser(id);
            res.sendStatus(204);
        } catch (err) {
            next(err);
        }
    }

    private getUserPosts = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.params.id;
            const count = stringAsNumber(req.query.count as string | undefined);
            const withCover = stringAsBoolean(req.query.withCover as string | undefined, true);
            const publicOnly = stringAsBoolean(req.query.publicOnly as string | undefined, false);

            const posts = await this.postService.getPosts({ userId, count, withCover, publicOnly });
            if (!publicOnly) {
                for (const post of posts) {
                    await this.permissionService.verifyPostReadAction(post.id, req.user);
                }
            }

            putCache(req.url, posts, 5);

            res.json(posts);
        } catch (err) {
            if (err instanceof SyntaxError) {
                next(new HttpException(400, 'Invalid request parameter'));
            }
            next(err);
        }
    }

    /**
     * All collections are public, the private posts are not included when publicOnly is true
     */
    private getUserCollections = async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params.id;
        const publicOnly = stringAsBoolean(req.query.publicOnly as string | undefined, false);
        try {
            const collections = await this.collectionService.getCollectionsByUser(id, publicOnly);
            if (!publicOnly) {
                for (const collection of collections) {
                    await this.permissionService.verifyUserAction(req.user, collection.creatorId);
                }
            }

            putCache(req.url, collections, 30);

            res.json(collections);
        } catch (err) {
            if (err instanceof SyntaxError) {
                next(new HttpException(400, 'Invalid request parameter'));
            }
            next(err);
        }
    }
}