import HttpException from './http.exception';

export default class UnprocessableEntityException extends HttpException {
    constructor(reason: string) {
        super(422, `Provided data is not processable due to: ${reason}`);
    }
}