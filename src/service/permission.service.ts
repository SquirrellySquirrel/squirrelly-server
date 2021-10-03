import { Service } from 'typedi';
import User, { UserRole } from '../entity/user';
import PermissionDeniedException from '../exception/permission-denied.exception';

@Service()
export default class PermissionService {
    verifyPermission(user: User, ownerId: string) {
        if (user.role == UserRole.ADMIN) {
            return;
        }
        if (user.role == UserRole.CONTRIBUTOR && user.id == ownerId) {
            return;
        }
        throw new PermissionDeniedException(user.id);
    }
}