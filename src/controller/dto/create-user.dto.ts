type DeviceType = 'android|ios';

export default class CreateUserDTO {
    public deviceId!: string;

    public deviceType!: DeviceType;
}