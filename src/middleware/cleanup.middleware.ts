
import { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

function cleanupMiddleware(request: Request, response: Response, next: NextFunction) {
    const tmpDir = process.env.TMP_DIR as string;
    fs.readdir(tmpDir, (err, files) => {
        if (err) console.error(err);

        for (const file of files) {
            const filePath = path.join(tmpDir, file);
            fs.unlink(filePath, err => {
                if (err) console.error(err);
            });
        }
    });
    next();
}

export default cleanupMiddleware;