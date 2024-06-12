import { NextFunction, Request, Response, Router } from 'express';
import { Service } from 'typedi';
import Controller from '../interfaces/controller.interface';
import AuthService from '../service/auth.service';

@Service()
export default class AuthController implements Controller {
    public path = '/tokens';
    public router = Router();

    constructor(private readonly authService: AuthService) {
        this.initRoutes();
    }

    private initRoutes() {
        this.router.post(this.path, this.verifyToken);
    }

    private verifyToken = async (req: Request, res: Response, next: NextFunction) => {
        const token = req.body['token'];
        try {
            const tokenData = this.authService.verifyToken(token);
            res.json(tokenData);
        } catch (err) {
            next(err);
        }
    }
}