import { Service } from 'typedi';
import { EntityRepository, Repository } from 'typeorm';
import Post from '../entity/post';

@Service()
@EntityRepository(Post)
export default class PostRepository extends Repository<Post> {
    findOneWithRelations(postId: string) {
        return this.findOne({ where: { id: postId }, relations: ['creator', 'location', 'photos', 'comments', 'comments.creator'], order: { created: 'DESC' } });
    }

    findLatest(publicOnly: boolean, count?: number): Promise<Post[]> {
        if (publicOnly) {
            return this.find({ where: { public: true }, take: count, order: { created: 'DESC' } });
        }
        return this.find({ take: count, order: { created: 'DESC' } });
    }

    findByUser(userId: string, publicOnly: boolean, count?: number): Promise<Post[]> {
        if (publicOnly) {
            return this.find({ where: { creator: { id: userId }, public: true }, take: count, order: { created: 'DESC' } });
        }
        return this.find({ where: { creator: { id: userId } }, take: count, order: { created: 'DESC' } });
    }

    findByLocation(locationId: string, publicOnly: boolean, count?: number): Promise<Post[]> {
        if (publicOnly) {
            return this.find({ where: { location: { id: locationId }, public: true }, take: count, order: { created: 'DESC' } });
        }
        return this.find({ where: { location: { id: locationId } }, take: count, order: { created: 'DESC' } });
    }

    findByUserAndLocation(userId: string, locationId: string, publicOnly: boolean, count?: number) {
        if (publicOnly) {
            return this.find({ where: { creator: { id: userId }, location: { id: locationId, public: true } }, take: count, order: { created: 'DESC' } });
        }
        return this.find({ where: { creator: { id: userId }, location: { id: locationId } }, take: count, order: { created: 'DESC' } });
    }
}