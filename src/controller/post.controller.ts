import { NextFunction, Request, Response, Router } from 'express';
import { Service } from 'typedi';
import NotFoundException from '../exception/not-found.exception';
import Controller from '../interfaces/controller.interface';
import CommentService from '../service/comment.service';
import PostService from '../service/post.service';

@Service()
export default class PostController implements Controller {
    public path = '/posts';
    public router = Router();

    constructor(
        private readonly postService: PostService,
        private readonly commentService: CommentService
    ) {
        this.initRoutes();
    }

    private initRoutes() {
        this.router.get(`${this.path}/:id`, this.getPost);
        this.router.get(`${this.path}/:id/comments`, this.getPostComments);
        this.router.post(this.path, this.createPost);
        this.router.post(`${this.path}/:id/comments`, this.createComment);
        this.router.put(`${this.path}/:id`, this.updatePost);
        this.router.delete(`${this.path}/:id`, this.deletePost);
        this.router.delete(`${this.path}/:id/comments/:commentId`, this.deleteComment);
    }

    private getPost = async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params.id;
        const post = await this.postService.getPost(id);
        if (post) {
            res.send(post);
        } else {
            next(new NotFoundException('Post', id));
        }
    }

    private createPost = async (req: Request, res: Response) => {
    }

    private updatePost = async (req: Request, res: Response) => {
    }

    private deletePost = async (req: Request, res: Response) => {
        const id = req.params.id;
        await this.postService.deletePost(id);
        res.sendStatus(204);
    }

    private getPostComments = async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params.id;
        const post = await this.postService.getPost(id);
        if (post) {
            res.send(post.comments)
        } else {
            next(new NotFoundException('Post', id));
        }
    }

    private createComment = async (req: Request, res: Response) => {
    }

    private deleteComment = async (req: Request, res: Response) => {
    }

}