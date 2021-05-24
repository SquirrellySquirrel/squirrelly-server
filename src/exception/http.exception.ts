import Exception from "./exception";

class HttpException extends Exception {
    constructor(status: number, message: string) {
        super(status, message);
    }
}

export default HttpException;