import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { getCustomRepository } from 'typeorm';
import { JWT_SECRET } from '../config';
import InvalidTokenException from '../exception/invalid-token.exception';
import TokenData from '../interfaces/token-data.interface';
import UserRepository from '../repository/user.repository';

/*
Resovle optional user id in cookies
*/
async function userIdResolverMiddleware(req: Request, _res: Response, next: NextFunction) {
    const cookies = req.cookies;
    if (cookies && cookies.Authorization) {
        try {
            const verificationResponse = jwt.verify(cookies.Authorization, JWT_SECRET) as TokenData;
            const id = verificationResponse._id;
            const userRepository = getCustomRepository(UserRepository);
            const user = await userRepository.findOne(id);
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