import { NextFunction, Request, Response, Router } from 'express';
import fs from 'fs';
import Sharp, { FitEnum, FormatEnum } from 'sharp';
import { Service } from 'typedi';
import Controller from '../interfaces/controller.interface';
import PhotoService from '../service/photo.service';
import { stringAsNumber } from '../util/param-parser';

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
        const width = stringAsNumber(req.query.w as string | undefined);
        const height = stringAsNumber(req.query.h as string | undefined);
        const format = req.query.format ? req.query.format as keyof FormatEnum : 'webp';
        const fit = req.query.fit ? req.query.fit as keyof FitEnum : 'cover';
        try {
            // cache for 3d
            res.set('Cache-Control', 'public, max-age=259200');

            const photoPath = await this.photoService.getPhotoPath(photoId);

            const stream = fs.createReadStream(photoPath);
            const transform = Sharp().resize(width, height, {
                fit,
            }).toFormat(format, {
                quality: 100,
            });
            res.set('Content-Type', `image/${format}`);
            stream.pipe(transform).pipe(res);
            return stream;
        } catch (err) {
            next(err);
        }
    }
}