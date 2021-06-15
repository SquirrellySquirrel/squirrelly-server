import { Service } from 'typedi';
import { EntityRepository, Repository } from 'typeorm';
import Photo from '../entity/photo';

@Service()
@EntityRepository(Photo)
export default class PhotoRepository extends Repository<Photo> {
    findByPost(postId: string): Promise<Photo[]> {
        return this.find({ where: { post: { id: postId } }, order: { order: 'ASC' } });
    }
}