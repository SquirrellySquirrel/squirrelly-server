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
        this.router.post(this.path, this.createUser);
        this.router.put(`${this.path}/:id`, this.updateUser);
        this.router.delete(`${this.path}/:id`, this.deleteUser);
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
        res.status(201)
            .send(await this.userService.createGhostUser(req.body['device_id'], req.body['device_type']));
    }

    private updateUser = async (req: Request, res: Response) => {
        const id = req.params.id;
        const email = req.body['email'];
        const password = req.body['password'];
        const displayName = req.body['display_name'];
        if (email && password) {
            res.send(await this.userService.upgradeGhostUser(id, email, password, displayName));
        } else {
            res.send(await this.userService.updateUser(id, displayName));
        }
    }

    private deleteUser = async (req: Request, res: Response) => {
        const id = req.params.id;
        await this.userService.deleteUser(id);
        res.sendStatus(204);
    }
}