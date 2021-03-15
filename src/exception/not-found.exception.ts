import HttpException from './http.exception';

class NotFoundException extends HttpException {
    constructor(entity: string, id: string) {
        super(404, `${entity} not found by id ${id}`);
    }
}

export default NotFoundException;