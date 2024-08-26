import HttpException from './http.exception';

export default class PreconditionFailedException extends HttpException {
    constructor(reason: string) {
        super(412, reason);
    }
}