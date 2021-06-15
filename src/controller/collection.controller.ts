import { NextFunction, Request, Response, Router } from 'express';
import { Service } from 'typedi';
import Controller from '../interfaces/controller.interface';
import requestValidationMiddleware from '../middleware/request-validation.middleware';
import CollectionService from '../service/collection.service';
import CreateCollectionDTO from './dto/create-collection.dto';
import UpdateCollectionDTO from './dto/update-collection.dto';

@Service()
export default class CollectionController implements Controller {
    public path = '/collections';
    public router = Router();

    constructor(private readonly collectionService: CollectionService) {
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
        try {
            const post = await this.collectionService.getCollection(id);
            res.json(post);
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
            res.json(await this.collectionService.updateCollection(
                id, postIds, { name: name, description: descrption }));
        } catch (err) {
            next(err);
        }
    }

    private deleteCollection = async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params.id;
        try {
            await this.collectionService.deleteCollection(id);
            res.sendStatus(204);
        } catch (err) {
            next(err);
        }
    }

}