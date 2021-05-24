import Exception from "./exception";

class TypeORMException extends Exception {
    constructor(message: string) {
        super(500, message);
    }
}

export default TypeORMException;