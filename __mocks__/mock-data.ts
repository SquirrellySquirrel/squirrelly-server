import Location from '../src/entity/location';
import Photo from "../src/entity/photo";

export class MockData {
    static DEFAULT_EMAIL = "foo@bar.com";
    static DEFAULT_DISPLAY_NAME = "foo";
    static DEFAULT_PASSWORD = "secure-Pa55";

    static location1(): Location {
        const location = new Location();
        location.latitude = 1.2;
        location.longitude = -2.3;
        location.address = 'Somewhere on the earch';
        return location;
    }

    static location2(): Location {
        const location = new Location();
        location.latitude = -1.2;
        location.longitude = 2.3;
        location.address = 'Somewhere only we know';
        return location;
    }

    static photo1(): Photo {
        const photo = new Photo();
        photo.path = '/path/to/photo-1';
        photo.type = 'png';
        photo.height = 400;
        photo.width = 600;
        photo.order = 0;
        return photo;
    }

    static photo2(): Photo {
        const photo = new Photo();
        photo.path = '/path/to/photo-2';
        photo.type = 'jpeg';
        photo.height = 800;
        photo.width = 600;
        photo.order = 0;
        return photo;
    }
}