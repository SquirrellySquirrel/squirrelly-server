import { NextFunction, Request, Response, Router } from 'express';
import { Service } from 'typedi';
import HttpException from '../exception/http.exception';
import Controller from '../interfaces/controller.interface';
import cacheMiddleware from '../middleware/cache.middleware';
import LocationService from '../service/location.service';
import { putCache } from '../util/cache';

@Service()
export default class LocationController implements Controller {
    public path = '/locations';
    public router = Router();

    constructor(private readonly locationService: LocationService) {
        this.initRoutes();
    }

    private initRoutes() {
        this.router.get(`${this.path}/:id`, cacheMiddleware, this.getLocation);
    }

    private getLocation = async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params.id;
        try {
            const location = await this.locationService.getLocationById(id);

            putCache(req.url, location, 60);

            res.json(location);
        } catch (err) {
            if (err instanceof SyntaxError) {
                next(new HttpException(400, 'Invalid request parameter'));
            }
            next(err);
        }
    }
}