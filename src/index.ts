require('dotenv').config();
import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import { connectDB } from './database';

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
    await connectDB();
    await startServer();
})();