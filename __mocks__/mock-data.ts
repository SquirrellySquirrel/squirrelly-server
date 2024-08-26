import { LocationParams } from '../src/service/model/location';
import { PhotoParams } from '../src/service/model/photo';

export class MockData {
    static DEFAULT_EMAIL = 'foo@bar.com';
    static EMAIL_2 = 'baz@qux.com';
    static DEFAULT_DISPLAY_NAME = 'foo';
    static DEFAULT_PASSWORD = 'secure-Pa55';

    static location1(): LocationParams {
        return { latitude: 1.2, longitude: -2.3, address: 'Somewhere on the earch' };
    }

    static location2(): LocationParams {
        return { latitude: -1.2, longitude: 2.3, address: 'Somewhere only we know' };
    }

    static photo1(): PhotoParams {
        return { name: 'photo-1', type: 'images/png', order: 0 };
    }

    static photo2(): PhotoParams {
        return { name: 'photo-2', type: 'image/jpeg', order: 1 };
    }
}