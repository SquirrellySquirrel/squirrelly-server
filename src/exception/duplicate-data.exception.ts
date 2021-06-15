import HttpException from './http.exception';

export default class DuplicateDataException extends HttpException {
    constructor(data: Record<string, unknown>) {
        super(409, `Provided ${JSON.stringify(data)} already exists`);
    }
}