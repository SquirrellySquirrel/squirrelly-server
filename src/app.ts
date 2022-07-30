require('dotenv').config({ path: `./.env.${process.env.NODE_ENV}` });
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import errorHandlingMiddleware from './middleware/error-handling.middleware';
import swaggerUi from 'swagger-ui-express';
import apiSpec from '../docs/swagger.json';

const PORT = Number(process.env.PORT) || 3000;
const ORIGIN = process.env.ALLOWED_ORIGINS || '*';

class App {
    public app: express.Application;

    corsOptions = {
        origin: ORIGIN,
        credentials: true,
        methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['X-Requested-With', 'X-HTTP-Method-Override', 'Content-Type', 'Accept'],
    }

    constructor(controllers) {
        this.app = express();

        this.initMiddlewares();
        this.initControllers(controllers);
        this.initErrorHandling();

        this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(apiSpec));
    }

    public listen() {
        this.app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    }

    private initMiddlewares() {
        this.app.use(cors(this.corsOptions));
        this.app.use(express.json());
        this.app.use(cookieParser());
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