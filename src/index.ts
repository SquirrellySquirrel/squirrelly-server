require('dotenv').config({ path: `./.env.${process.env.NODE_ENV}` });
import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import connection from './database';

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = Number(process.env.PORT) || 3000;

app.get('/', (req, res) => res.send('Hello squirrel!'));

const startServer = async () => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
};

(async () => {
    await connection.create();
    await startServer();
})();