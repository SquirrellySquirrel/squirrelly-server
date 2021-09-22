import Exception from './exception';

export default class HttpException extends Exception {
    constructor(status: number, message: string) {
        super(status, message);
    }
}