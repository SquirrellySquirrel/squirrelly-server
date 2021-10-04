import fs, { promises as fsPromises } from 'fs';
import path from 'path';
import { Service } from 'typedi';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { FILE_DIR, TMP_DIR } from '../config';
import Photo from '../entity/photo';
import NotFoundException from '../exception/not-found.exception';
import UnprocessableEntityException from '../exception/unprocessable-entity.exception';
import PhotoRepository from '../repository/photo.repository';

type PhotoId = Pick<Photo, 'id'>;

@Service()
export default class PhotoService {
    constructor(
        @InjectRepository()
        private readonly photoRepository: PhotoRepository
    ) { }

    async getPhotoPath(id: string): Promise<string> {
        const photo = await this.getPhoto(id);
        if (!photo) {
            throw new NotFoundException('Photo', id);
        }
        return path.join(FILE_DIR, photo.name);
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

    async updatePhoto(postId: string, photoId: string, order: number) {
        const photo = await this.photoRepository.findOneWithPost(photoId);
        if (!photo) {
            throw new NotFoundException('photo', photoId);
        }

        if (photo.post.id != postId) {
            throw new UnprocessableEntityException(`Photo ${photoId} doesn't belong to post ${postId}`);
        }

        return await this.photoRepository.save({
            id: photoId,
            order: order,
        });
    }

    async deletePhoto(postId: string, photoId: string) {
        const photo = await this.photoRepository.findOneWithPost(photoId);
        if (!photo) return;

        if (photo.post.id != postId) {
            throw new UnprocessableEntityException(`Photo ${photoId} doesn't belong to post ${postId}`);
        }

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

    private async getPhoto(id: string): Promise<Photo | undefined> {
        return await this.photoRepository.findOne(id);
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