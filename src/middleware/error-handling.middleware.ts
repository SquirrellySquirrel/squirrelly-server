
import { NextFunction, Request, Response } from 'express';
import Exception from '../exception/exception';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function errorHandlingMiddleware(error: Exception, request: Request, response: Response, _next: NextFunction) {
    const status = error.status || 500;
    const message = error.message || 'Something went wrong';
    response
        .status(status)
        .send({
            message,
            status,
        });
}

export default errorHandlingMiddleware;