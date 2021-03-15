import { Service } from 'typedi';
import { EntityRepository, Repository } from "typeorm";
import Photo from "../entity/photo";

@Service()
@EntityRepository(Photo)
export default class PhotoRepository extends Repository<Photo> {
}