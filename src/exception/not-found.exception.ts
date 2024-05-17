import { KeyValuePair } from '../util/types';
import HttpException from './http.exception';

export default class NotFoundException extends HttpException {
    constructor(entityType: string, identifier: KeyValuePair) {
        super(404, `${entityType.toString()} not found by: ${identifier.key}=${identifier.value}`);
    }
}