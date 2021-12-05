import { Service } from 'typedi';
import { EntityRepository, Repository } from 'typeorm';
import Post from '../entity/post';

@Service()
@EntityRepository(Post)
export default class PostRepository extends Repository<Post> {
    findOneWithCreator(postId: string): Promise<Post | undefined> {
        return this.findOne({ where: { id: postId }, relations: ['creator'] });
    }

    findOneWithRelations(postId: string): Promise<Post | undefined> {
        return this.findOne({ where: { id: postId }, relations: ['creator', 'location', 'photos'] });
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