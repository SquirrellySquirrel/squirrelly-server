import fs, { promises as fsPromises } from 'fs';
import path from 'path';
import { Service } from 'typedi';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { FILE_DIR, TMP_DIR } from '../config';
import Photo from '../entity/photo';
import PhotoRepository from '../repository/photo.repository';

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
            name: photo.name,
            type: photo.type,
            order: photo.order,
            post: { id: postId },
        });

        try {
            await this.savePhotoToStorage(photo.name);
        } catch (err) {
            console.error(err);
            await this.photoRepository.delete(savedPhoto.id);
            this.removeTempPhoto(photo.name);
            throw err;
        }

        return { id: savedPhoto.id };
    }

    async updatePhoto(photoId: string, order: number) {
        return await this.photoRepository.save({
            id: photoId,
            order: order,
        });
    }

    async deletePhoto(photoId: string) {
        const photo = await this.getPhoto(photoId);
        if (!photo) return;

        await this.photoRepository.delete(photoId);
        this.removePhotoFromStorage(photo.name);
    }

    async getPostCover(postId: string): Promise<Photo | undefined> {
        const photos = await this.getPhotosByPost(postId);
        if (photos.length < 1) {
            return undefined;
        }
        return photos[0];
    }

    async removePhotosFromStorage(names: string[]): Promise<void> {
        return names.forEach((name) => this.removePhotoFromStorage(name));
    }

    private async savePhotoToStorage(name: string): Promise<void> {
        const srcPath = path.join(TMP_DIR, name);
        const destPath = path.join(FILE_DIR, name);
        return fsPromises.rename(srcPath, destPath);
    }

    private async removePhotoFromStorage(name: string): Promise<void> {
        return this.removePhoto(path.join(FILE_DIR, name));
    }

    private async removeTempPhoto(name: string): Promise<void> {
        return this.removePhoto(path.join(TMP_DIR, name));
    }

    private async removePhoto(filePath: string): Promise<void> {
        if (fs.existsSync(filePath)) {
            return fsPromises.unlink(filePath);
        }
    }
}