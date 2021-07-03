import fs, { promises as fsPromises } from 'fs';
import path from 'path';
import { Service } from 'typedi';
import { InjectRepository } from 'typeorm-typedi-extensions';
import Photo from '../entity/photo';
import PhotoRepository from '../repository/photo.repository';

const tmpDir = process.env.TMP_DIR as string;
const fileDir = process.env.FILE_DIR as string;

type PhotoId = Pick<Photo, 'id'>;

@Service()
export default class PhotoService {
    constructor(
        @InjectRepository()
        private readonly photoRepository: PhotoRepository
    ) { }

    async getPhoto(id: string): Promise<Photo | undefined> {
        return await this.photoRepository.findOne(id);
    }

    async getPhotosByPost(postId: string): Promise<Photo[]> {
        return await this.photoRepository.findByPost(postId);
    }

    async addPhotoToPost(postId: string, photo: Photo): Promise<PhotoId> {
        const savedPhoto = await this.photoRepository.save({
            id: photo.id,
            path: photo.path,
            type: photo.type,
            order: photo.order,
            post: { id: postId },
        });

        await this.savePhotoToDisk(photo.path);

        return { id: savedPhoto.id };
    }

    async deletePhoto(photoId: string) {
        const photo = await this.getPhoto(photoId);
        if (!photo) return;

        await this.photoRepository.delete(photoId);
        this.removePhotoFromDisk(photo.path);
    }

    async getPostCover(postId: string): Promise<Photo | undefined> {
        const photos = await this.getPhotosByPost(postId);
        if (photos.length < 1) {
            return undefined;
        }
        return photos[0];
    }

    async removePhotosFromStorage(filenames: string[]) {
        filenames.forEach((name) => this.removePhotoFromDisk(name));
    }

    private async savePhotoToDisk(name: string): Promise<void> {
        const srcPath = path.join(tmpDir, name);
        const destPath = path.join(fileDir, name);
        return fsPromises.rename(srcPath, destPath);
    }

    private async removePhotoFromDisk(name: string): Promise<void> {
        const filePath = path.join(fileDir, name);
        if (fs.existsSync(filePath)) {
            return fsPromises.unlink(filePath);
        }
    }
}