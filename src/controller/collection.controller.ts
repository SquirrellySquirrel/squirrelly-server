import { NextFunction, Request, Response, Router } from 'express';
import { Service } from 'typedi';
import NotFoundException from '../exception/not-found.exception';
import Controller from '../interfaces/controller.interface';
import CollectionService from '../service/collection.service';

@Service()
export default class CollectionController implements Controller {
    public path = '/collections';
    public router = Router();

    constructor(private readonly collectionService: CollectionService) {
        this.initRoutes();
    }

    private initRoutes() {
        this.router.get(`${this.path}/:id`, this.getCollection);
        this.router.post(this.path, this.createCollection);
        this.router.put(`${this.path}/:id`, this.updateCollection);
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

    private createCollection = async (req: Request, res: Response) => {
    }

    private updateCollection = async (req: Request, res: Response) => {
    }

    private deleteCollection = async (req: Request, res: Response) => {
        const id = req.params.id;
        await this.collectionService.deleteCollection(id);
        res.sendStatus(204);
    }

}