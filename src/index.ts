import 'reflect-metadata';
import { useContainer } from 'typeorm';
import { Container } from 'typeorm-typedi-extensions';
import App from './app';
import PostController from './controller/post.controller';
import UserController from './controller/user.controller';
import connection from './database';

useContainer(Container);

(async () => {
    await connection.create();
    const app = new App(
        [
            Container.get(UserController),
            Container.get(PostController)
        ]
    );

    app.listen();
})();