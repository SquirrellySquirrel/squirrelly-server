import { Service } from 'typedi';
import { EntityRepository, Repository } from "typeorm";
import Post from "../entity/post";

@Service()
@EntityRepository(Post)
export default class PostRepository extends Repository<Post> {
    findOneWithRelations(postId: string) {
        return this.findOne({ where: { id: postId }, relations: ["creator", "location", "photos", "comments", "comments.creator"], order: { created: 'DESC' } });
    }

    findLatest(count?: number): Promise<Post[]> {
        return this.find({ take: count, order: { created: 'DESC' } });
    }

    findByUser(userId: string, count?: number): Promise<Post[]> {
        return this.find({ where: { creator: { id: userId } }, take: count, order: { created: 'DESC' } });
    }

    findByLocation(locationId: string, count?: number): Promise<Post[]> {
        return this.find({ where: { location: { id: locationId } }, take: count, order: { created: 'DESC' } });
    }
}