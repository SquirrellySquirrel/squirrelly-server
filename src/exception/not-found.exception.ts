import HttpException from './http.exception';

export default class NotFoundException extends HttpException {
    constructor(entity: string, identifier: string) {
        super(404, `${entity} not found by: ${identifier}`);
    }
}