import 'reflect-metadata';
import Container from 'typedi';
import App from './app';
import AuthController from './controller/auth.controller';
import CollectionController from './controller/collection.controller';
import LocationController from './controller/location.controller';
import PhotoController from './controller/photo.controller';
import PostController from './controller/post.controller';
import UserController from './controller/user.controller';

(async () => {
    const app = new App(
        [
            Container.get(AuthController),
            Container.get(UserController),
            Container.get(PostController),
            Container.get(PhotoController),
            Container.get(CollectionController),
            Container.get(LocationController),
        ]
    );

    app.listen();
})();