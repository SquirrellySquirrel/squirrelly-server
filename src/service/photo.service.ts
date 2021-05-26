import { Service } from 'typedi';
import { InjectRepository } from 'typeorm-typedi-extensions';
import Photo from "../entity/photo";
import TypeORMException from "../exception/typeorm.exception";
import PhotoRepository from "../repository/photo.repository";

@Service()
export default class PhotoService {
    constructor(
        @InjectRepository()
        private readonly photoRepository: PhotoRepository
    ) { }

    async getPostCover(postId: string): Promise<Photo | undefined> {
        return await this.photoRepository.findOne({ where: { post: { id: postId } }, order: { order: "ASC" } });
    }

    async getPhoto(id: string): Promise<Photo | undefined> {
        return await this.photoRepository.findOne(id);
    }

    // manually upsert photos as typoeorm doesn't support orphan removal atm (#1351)
    async upsertPhotosByPost(postId: string, photos: Photo[]): Promise<Photo[]> {
        const existingPhotoIds = (await this.photoRepository.find({ select: ['id'], where: { post: { id: postId } } })).map(photo => photo.id);
        const photoIdsToUpdate = photos.map(photo => photo.id);
        for (let id of existingPhotoIds) {
            if (!photoIdsToUpdate.includes(id)) {
                await this.photoRepository.delete(id);
            }
        }
        return this.photoRepository.save(photos)
            .catch((err: Error) => {
                throw new TypeORMException(err.message);
            });
    }

    // identify photos that are deleted in the db
    async identifyPhotosToRemove(idToNameMap: Map<string, string>) {
        const photos: string[] = [];
        for (let [id, name] of idToNameMap) {
            const photo = await this.getPhoto(id);
            if (!photo) {
                photos.push(name);
            }
        }
        return photos;
    }
}