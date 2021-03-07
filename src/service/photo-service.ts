import { Photo } from "../entity/photo";
import { PhotoRepository } from "../repository/photo-repository";

export class PhotoService {
    public constructor(
        private readonly photoRepository: PhotoRepository
    ) { }

    getPostCover(postId: string): Promise<Photo | undefined> {
        return this.photoRepository.findOne({ where: { post: { id: postId } }, order: { order: "ASC" } });
    }

    // manually upsert photos as typoeorm doesn't support orphan removal atm (#1351)
    async upsertPhotosByPost(postId: string, photos: Photo[]): Promise<Photo[]> {
        const existingPhotoIds = (await this.photoRepository.find({ select: ['id'], where: { post: { id: postId } } })).map(photo => photo.id);
        const photoIdsToUpdate = photos.map(photo => photo.id);
        for (let id of existingPhotoIds) {
            if (!photoIdsToUpdate.includes(id)) {
                this.photoRepository.delete(id);
            }
        }
        return this.photoRepository.save(photos);
    }
}