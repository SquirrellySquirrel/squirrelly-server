import HttpException from './http.exception';

export default class DuplicateDataException extends HttpException {
    constructor(data: object) {
        super(409, `Provided ${JSON.stringify(data)} already exists`);
    }
}