import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import Container from 'typedi';
import { JWT_SECRET } from '../config';
import UserDao from '../db/dao/user.dao';
import InvalidTokenException from '../exception/invalid-token.exception';
import TokenData from '../interfaces/token-data.interface';

/*
Resovle optional user id in cookies
*/
async function userIdResolverMiddleware(req: Request, _res: Response, next: NextFunction) {
    const cookies = req.cookies;
    if (cookies && cookies.Authorization) {
        try {
            const verificationResponse = jwt.verify(cookies.Authorization, JWT_SECRET) as TokenData;
            const id = verificationResponse._id;
            const userDao = Container.get(UserDao);
            const user = await userDao.findById(id);
            if (user) {
                req.user = user;
                next();
            } else {
                next(new InvalidTokenException());
            }
        } catch (error) {
            next(new InvalidTokenException());
        }
    } else {
        next();
    }
}

export default userIdResolverMiddleware;