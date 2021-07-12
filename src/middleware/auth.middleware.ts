import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { getCustomRepository } from 'typeorm';
import { JWT_SECRET } from '../config';
import ForbiddenException from '../exception/forbidden.exception';
import TokenData from '../interfaces/token-data.interface';
import UserRepository from '../repository/user.repository';

async function authMiddleware(request: Request, response: Response, next: NextFunction) {
    const cookies = request.cookies;
    if (cookies && cookies.Authorization) {
        try {
            const verificationResponse = jwt.verify(cookies.Authorization, JWT_SECRET) as TokenData;
            const id = verificationResponse._id;
            const userRepository = getCustomRepository(UserRepository);
            const user = await userRepository.findOne(id);
            if (user) {
                next();
            } else {
                next(new ForbiddenException());
            }
        } catch (error) {
            next(new ForbiddenException());
        }
    } else {
        next(new ForbiddenException());
    }
}

export default authMiddleware;