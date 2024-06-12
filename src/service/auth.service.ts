import jwt from 'jsonwebtoken';
import { Service } from 'typedi';
import { JWT_SECRET } from '../config';
import InvalidTokenException from '../exception/invalid-token.exception';
import TokenData from '../interfaces/token-data.interface';

@Service()
export default class AuthService {
    verifyToken(token: string): TokenData {
        try {
            return jwt.verify(token, JWT_SECRET) as TokenData;
        } catch (err) {
            throw new InvalidTokenException();
        }
    }
}