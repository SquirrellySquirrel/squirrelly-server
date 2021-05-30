import HttpException from './http.exception';

export default class InvalidInputDataException extends HttpException {
    constructor(data: object) {
        super(422, `Provided data invalid: ${JSON.stringify(data)}`);
    }
}