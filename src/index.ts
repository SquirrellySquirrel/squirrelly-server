import 'reflect-metadata';
import App from './app';
import UserController from './controller/user.controller';
import connection from './database';

(async () => {
    await connection.create();
    const app = new App(
        [
            new UserController()
        ]
    );

    app.listen();
})();