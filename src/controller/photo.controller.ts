import { NextFunction, Request, Response, Router } from 'express';
import { Service } from 'typedi';
import Controller from '../interfaces/controller.interface';
import authMiddleware from '../middleware/auth.middleware';
import PhotoService from '../service/photo.service';

@Service()
export default class PhotoController implements Controller {
    public path = '/photos';
    public router = Router();

    constructor(private readonly photoService: PhotoService) {
        this.initRoutes();
    }

    private initRoutes() {
        this.router.get(`${this.path}/:id`, this.getPhoto)
            .delete(`${this.path}/:id`, authMiddleware, this.deletePhoto);
    }

    private getPhoto = async (req: Request, res: Response, next: NextFunction) => {
        const photoId = req.params.id;
        try {
            const photoPath = await this.photoService.getPhotoPath(photoId);

            res.sendFile(photoPath);
        } catch (err) {
            next(err);
        }
    }

    private deletePhoto = async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params.photoId;
        try {
            await this.photoService.deletePhoto(id);

            res.sendStatus(204);
        } catch (err) {
            next(err);
        }
    }

}