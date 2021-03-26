import HttpException from './http.exception';

export default class UnauthorizedException extends HttpException {
    constructor() {
        super(401, 'Invalid credentials');
    }
}