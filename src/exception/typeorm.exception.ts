import Exception from './exception';

export default class TypeORMException extends Exception {
    constructor(message: string) {
        super(500, message);
    }
}