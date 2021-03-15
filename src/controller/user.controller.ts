import { NextFunction, Request, Response, Router } from 'express';
import { Service } from 'typedi';
import UserNotFoundException from '../exception/user-not-found.exception';
import Controller from '../interfaces/controller.interface';
import UserService from '../service/user.service';

@Service()
export default class UserController implements Controller {
    public path = '/users';
    public router = Router();

    constructor(private readonly userService: UserService) {
        this.initRoutes();
    }

    private initRoutes() {
        this.router.get(`${this.path}/:id`, this.getUser);
        this.router.post(this.path, this.createUser)
    }

    private getUser = async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params.id;
        const user = await this.userService.getUser(id);
        if (user) {
            res.send(user);
        } else {
            next(new UserNotFoundException(id));
        }
    }

    private createUser = async (req: Request, res: Response) => {
        return res.send(await this.userService.createGhostUser(req.body['device_id'], req.body['device_type']));
    }
}