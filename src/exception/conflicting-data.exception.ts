import { KeyValuePair } from '../util/types';
import HttpException from './http.exception';

export default class ConflictingDataException extends HttpException {
    constructor(entityType: string, identifier: KeyValuePair) {
        super(409, `${entityType} with provided identifier already exists: ${identifier.key}=${identifier.value}`);
    }
}