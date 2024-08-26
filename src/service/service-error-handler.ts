import DBException from '../exception/db.exception';

export function mapError(err: any) {
    if (typeof err === 'string') {
        return new DBException(err);
    } else if (err instanceof Error) {
        return new DBException(err.message);
    } else {
        return err;
    }
}