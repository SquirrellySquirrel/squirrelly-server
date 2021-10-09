import { EntityType } from '../entity/entity-type';
import { KeyValuePair } from '../util/types';
import HttpException from './http.exception';

export default class NotFoundException extends HttpException {
    constructor(entity: EntityType, identifier: KeyValuePair) {
        super(404, `${entity.toString()} not found by: ${identifier.key}=${identifier.value}`);
    }
}