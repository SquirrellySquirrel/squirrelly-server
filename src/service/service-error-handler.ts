import TypeORMException from '../exception/typeorm.exception';

export function mapError(err: any) {
    if (typeof err === 'string') {
        return new TypeORMException(err);
    } else if (err instanceof Error) {
        return new TypeORMException(err.message);
    } else {
        return err;
    }
}