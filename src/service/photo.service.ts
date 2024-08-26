import { Photo } from '@prisma/client';
import fs, { promises as fsPromises } from 'fs';
import path from 'path';
import { Inject, Service } from 'typedi';
import { FILE_DIR, TMP_DIR } from '../config';
import PhotoDao from '../db/dao/photo.dao';
import NotFoundException from '../exception/not-found.exception';
import PreconditionFailedException from '../exception/precondition-failed.exception';
import UnprocessableEntityException from '../exception/unprocessable-entity.exception';
import { PhotoParams } from './model/photo';

@Service()
export default class PhotoService {
    constructor(
        @Inject()
        private readonly photoDao: PhotoDao
    ) { }

    async getPhotoPath(id: string): Promise<string> {
        const photo = await this.getPhoto(id);
        if (!photo) {
            throw new NotFoundException('PHOTO', { key: 'id', value: id });
        }
        return path.join(FILE_DIR, photo.name);
    }

    async getPhotosByPost(postId: string): Promise<Photo[]> {
        return this.photoDao.findByPost(postId);
    }

    async addPhotoToPost(postId: string, photo: PhotoParams) {
        const postPhotos = await this.getPhotosByPost(postId);
        if (postPhotos.length == 10) {
            throw new PreconditionFailedException('Cannot add more than 10 photos to the post');
        }

        const savedPhoto = await this.photoDao.create(
            postId, { name: photo.name, type: photo.type, order: photo.order });

        try {
            await this.savePhotoToStorage(photo.name);
        } catch (err) {
            console.error(err);
            this.photoDao.delete(savedPhoto.id);
            this.removeTempPhoto(photo.name);
            throw err;
        }

        return { id: savedPhoto.id };
    }

    async updatePhoto(postId: string, photoId: string, order: number) {
        const photo = await this.photoDao.findById(photoId);
        if (!photo) {
            throw new NotFoundException('PHOTO', { key: 'id', value: photoId });
        }

        if (photo.postId != postId) {
            throw new UnprocessableEntityException(`Photo ${photoId} doesn't belong to post ${postId}`);
        }

        return this.photoDao.updateOrder(photoId, order);
    }

    async deletePhoto(postId: string, photoId: string) {
        const photo = await this.photoDao.findById(photoId);
        if (!photo) return;

        if (photo.postId != postId) {
            throw new UnprocessableEntityException(`Photo ${photoId} doesn't belong to post ${postId}`);
        }

        await this.photoDao.delete(photoId);
        this.removePhotoFromStorage(photo.name);
    }

    async getPostCover(postId: string): Promise<Photo | null> {
        const photos = await this.getPhotosByPost(postId);
        if (photos.length < 1) {
            return null;
        }
        return photos[0];
    }

    async removePhotosFromStorage(names: string[]): Promise<void> {
        return names.forEach((name) => this.removePhotoFromStorage(name));
    }

    private async getPhoto(id: string) {
        return this.photoDao.findById(id);
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