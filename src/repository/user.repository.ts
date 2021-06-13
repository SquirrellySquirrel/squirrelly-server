import { Service } from 'typedi';
import { EntityRepository, Repository } from "typeorm";
import User from "../entity/user";

@Service()
@EntityRepository(User)
export default class UserRepository extends Repository<User> {
    findByEmail(email: string) {
        return this.findOne({ where: { email: email } });
    }

    findByDisplayName(displayName: string) {
        return this.findOne({ where: { displayName: displayName } });
    }
}