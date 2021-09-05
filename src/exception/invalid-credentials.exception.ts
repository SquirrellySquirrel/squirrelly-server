import HttpException from './http.exception';

export default class InvalidCredentialsException extends HttpException {
    constructor() {
        super(401, 'Invalid user credentials');
    }
}