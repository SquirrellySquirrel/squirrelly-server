import HttpException from './http.exception';

export default class ConflictingDataException extends HttpException {
    constructor(key: string, value: any) {
        super(409, `Provided ${key} '${value}' already exists`);
    }
}