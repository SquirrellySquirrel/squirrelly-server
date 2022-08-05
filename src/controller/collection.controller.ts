import { NextFunction, Request, Response, Router } from 'express';
import { Service } from 'typedi';
import Controller from '../interfaces/controller.interface';
import authenticationMiddleware from '../middleware/authentication.middleware';
import cacheMiddleware from '../middleware/cache.middleware';
import requestValidationMiddleware from '../middleware/request-validation.middleware';
import CollectionService from '../service/collection.service';
import PermissionService from '../service/permission.service';
import { putCache } from '../util/cache';
import CreateCollectionDTO from './dto/create-collection.dto';
import UpdateCollectionDTO from './dto/update-collection.dto';

@Service()
export default class CollectionController implements Controller {
    public path = '/collections';
    public router = Router();

    constructor(private readonly collectionService: CollectionService,
        private readonly permissionService: PermissionService) {
        this.initRoutes();
    }

    private initRoutes() {
        this.router.get(`${this.path}/:id`, cacheMiddleware, this.getCollection)
            .post(this.path, authenticationMiddleware, requestValidationMiddleware(CreateCollectionDTO), this.createCollection)
            .put(`${this.path}/:id`, authenticationMiddleware, requestValidationMiddleware(UpdateCollectionDTO), this.updateCollection)
            .delete(`${this.path}/:id`, authenticationMiddleware, this.deleteCollection);
    }

    private getCollection = async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params.id;
        try {
            const collection = await this.collectionService.getCollection(id);
            putCache(req.url, collection, 30);
            res.json(collection);
        } catch (err) {
            next(err);
        }
    }

    private createCollection = async (req: Request, res: Response, next: NextFunction) => {
        const postIds = req.body['postIds'] as string[];
        const userId = req.body['userId'];
        const name = req.body['name'];
        const descrption = req.body['description'];

        try {
            this.permissionService.verifyUserAction(req.user, userId);

            res.status(201)
                .json(await this.collectionService.createCollection(
                    postIds, userId, { name: name, description: descrption }));
        } catch (err) {
            next(err);
        }
    }

    private updateCollection = async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params.id;
        const postIds = req.body['postIds'] as string[];
        const name = req.body['name'];
        const descrption = req.body['description'];

        try {
            await this.permissionService.verifyCollectionAction(req.user, id);

            await this.collectionService.updateCollection(
                id, postIds, { name: name, description: descrption });
            res.sendStatus(204);
        } catch (err) {
            next(err);
        }
    }

    private deleteCollection = async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params.id;
        try {
            await this.permissionService.verifyCollectionAction(req.user, id);

            await this.collectionService.deleteCollection(id);
            res.sendStatus(204);
        } catch (err) {
            next(err);
        }
    }

}