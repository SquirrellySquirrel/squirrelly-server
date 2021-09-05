import HttpException from './http.exception';

export default class InvalidTokenException extends HttpException {
    constructor() {
        super(401, 'Invalid or expired auth token');
    }
}