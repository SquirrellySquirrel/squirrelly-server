type SystemName = 'Android|iOS|iPhone OS'; // documentation: https://github.com/react-native-device-info/react-native-device-info#getsystemname

export default class CreateUserDTO {
    public deviceId!: string;

    public systemName!: SystemName;
}