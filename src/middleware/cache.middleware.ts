import { NextFunction, Request, Response } from 'express';
import mcache from 'memory-cache';

function cacheMiddleware(req: Request, res: Response, next: NextFunction) {
    const key = 'squirrelly_' + req.url;
    const cachedBody = mcache.get(key);
    if (cachedBody) {
        res.json(cachedBody);
    } else {
        next();
    }
}

export default cacheMiddleware;