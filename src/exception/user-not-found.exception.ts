import NotFoundException from "./not-found.exception";

class UserNotFoundException extends NotFoundException {
    constructor(id: string) {
        super('User', id);
    }
}

export default UserNotFoundException;