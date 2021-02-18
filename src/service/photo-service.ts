import { getCustomRepository } from "typeorm";
import { Photo } from "../entity/photo";
import { PhotoRepository } from "../repository/photo-repository";

export class PhotoService {
    photoRepository = getCustomRepository(PhotoRepository);

    getPostCover(postId: string): Promise<Photo | undefined> {
        return this.photoRepository.findOne({ where: { post: { id: postId } }, order: { order: "ASC" } });
    }
}