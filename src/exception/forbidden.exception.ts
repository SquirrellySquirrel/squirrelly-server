import HttpException from './http.exception';

export default class ForbiddenException extends HttpException {
    constructor() {
        super(403, 'Invalid or expired auth token');
    }
}