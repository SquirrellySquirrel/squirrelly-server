import { Service } from 'typedi';
import { EntityRepository, Repository } from 'typeorm';
import Photo from '../entity/photo';

@Service()
@EntityRepository(Photo)
export default class PhotoRepository extends Repository<Photo> {
    findOneWithPost(id: string): Promise<Photo | undefined> {
        return this.findOne({ where: { id: id }, relations: ['post'] });
    }

    findByPost(postId: string): Promise<Photo[]> {
        return this.find({ where: { post: { id: postId } }, order: { order: 'ASC' } });
    }
}