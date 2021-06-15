require('dotenv').config({ path: `./.env.${process.env.NODE_ENV}` });
import cors from 'cors';
import express from 'express';
import cleanupMiddleware from './middleware/cleanup.middleware';
import errorHandlingMiddleware from './middleware/error-handling.middleware';

const PORT = Number(process.env.PORT) || 3000;

class App {
    public app: express.Application;

    constructor(controllers) {
        this.app = express();

        this.initMiddlewares();
        this.initControllers(controllers);
        this.initErrorHandling();
    }

    public listen() {
        this.app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    }

    private initMiddlewares() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(cleanupMiddleware);
    }

    private initControllers(controllers) {
        controllers.forEach((controller) => {
            this.app.use('/api', controller.router);
        });
    }

    private initErrorHandling() {
        this.app.use(errorHandlingMiddleware);
    }
}

export default App;