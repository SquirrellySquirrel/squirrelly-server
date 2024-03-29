import HttpException from './http.exception';

export default class PermissionDeniedException extends HttpException {
    constructor(userId?: string) {
        super(403, 'Access not allowed'.concat(userId ? ` for user: ${userId}` : ''));
    }
}