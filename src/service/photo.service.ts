import fs from 'fs';
import path from 'path';
import { Service } from 'typedi';
import { InjectRepository } from 'typeorm-typedi-extensions';
import Photo from '../entity/photo';
import Post from '../entity/post';
import PhotoRepository from '../repository/photo.repository';

const tmpDir = process.env.TMP_DIR as string;
const fileDir = process.env.FILE_DIR as string;

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

    async getPostCover(postId: string): Promise<Photo | undefined> {
        const photos = await this.getPhotosByPost(postId);
        if (photos.length < 1) {
            return undefined;
        }
        return photos[0];
    }

    // manually update photos as typoeorm doesn't support orphan removal atm (#1351)
    async updatePhotos(photosToAdd: Photo[], photosToRemove: Photo[]) {
        if (photosToAdd.length > 0) {
            await this.photoRepository.save(photosToAdd);
        }
        if (photosToRemove.length > 0) {
            await this.photoRepository.delete(photosToRemove.map((photo) => photo.id));
        }
    }

    identifyPhotosToAdd(post: Post, photos: Photo[]): Photo[] {
        const photosToAdd: Photo[] = [];
        photos.forEach((photo) => {
            if (!photo.id) {
                photo.post = post;
                photosToAdd.push(photo);
            }
        });
        return photosToAdd;
    }

    async identifyPhotosToRemove(postId: string, photos: Photo[]): Promise<Photo[]> {
        const existingPhotos = (await this.photoRepository.findByPost(postId));

        const photoIdsToUpdate = photos.filter((photo) => photo.id).map((photo) => photo.id);
        const photoIdsToRemove = existingPhotos.filter((photo) => !photoIdsToUpdate.includes(photo.id))
            .map((photo) => photo.id);

        return existingPhotos.filter((photo) => photoIdsToRemove.includes(photo.id));
    }

    async addPhotosToStorage(filenames: string[]) {
        filenames.forEach((filename) => {
            fs.rename(path.join(tmpDir, filename), path.join(fileDir, filename), (err) => {
                if (err) {
                    console.error(err);
                    return;
                }
            });
        });
    }

    async removePhotosFromStorage(filenames: string[]) {
        filenames.forEach((filename) => {
            const filePath = path.join(fileDir, filename);
            if (fs.existsSync(filePath)) {
                fs.unlink(filePath, (err) => {
                    if (err) {
                        console.error(err);
                        return;
                    }
                });
            }
        });
    }
}