import { Photo } from "../entity/photo";
import { PhotoRepository } from "../repository/photo-repository";

export class PhotoService {
    public constructor(
        private readonly photoRepository: PhotoRepository
    ) { }

    getPostCover(postId: string): Promise<Photo | undefined> {
        return this.photoRepository.findOne({ where: { post: { id: postId } }, order: { order: "ASC" } });
    }
}