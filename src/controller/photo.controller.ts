import { NextFunction, Request, Response, Router } from 'express';
import { Service } from 'typedi';
import Controller from '../interfaces/controller.interface';
import PhotoService from '../service/photo.service';

@Service()
export default class PhotoController implements Controller {
    public path = '/photos';
    public router = Router();

    constructor(private readonly photoService: PhotoService) {
        this.initRoutes();
    }

    private initRoutes() {
        this.router.get(`${this.path}/:id`, this.getPhoto);
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
}