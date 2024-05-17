import 'reflect-metadata';
import Container from 'typedi';
import App from './app';
import CollectionController from './controller/collection.controller';
import PhotoController from './controller/photo.controller';
import PostController from './controller/post.controller';
import UserController from './controller/user.controller';

(async () => {
    const app = new App(
        [
            Container.get(UserController),
            Container.get(PostController),
            Container.get(PhotoController),
            Container.get(CollectionController),
        ]
    );

    app.listen();
})();