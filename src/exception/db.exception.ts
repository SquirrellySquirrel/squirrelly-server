import Exception from './exception';

export default class DBException extends Exception {
    constructor(message: string) {
        super(500, message);
    }
}