import { EntityType } from '../entity/entity-type';
import { KeyValuePair } from '../util/types';
import HttpException from './http.exception';

export default class ConflictingDataException extends HttpException {
    constructor(entity: EntityType, identifier: KeyValuePair) {
        super(409, `${entity} with provided identifier already exists: ${identifier.key}=${identifier.value}`);
    }
}