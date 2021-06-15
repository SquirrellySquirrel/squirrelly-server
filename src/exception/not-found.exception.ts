import HttpException from './http.exception';

export default class NotFoundException extends HttpException {
    constructor(entity: string, id: string) {
        super(404, `${entity} not found by id: ${id}`);
    }
}