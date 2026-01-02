import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequalize';

export interface UserDeviceAttributes {
    id?: string;
    userId: string;
    fcmToken: string;
    platform: 'web' | 'android' | 'ios';
    lastActive?: Date;
}

class UserDevice extends Model<UserDeviceAttributes> implements UserDeviceAttributes {
    declare id: string;
    declare userId: string;
    declare fcmToken: string;
    declare platform: 'web' | 'android' | 'ios';
    declare lastActive: Date;
}

UserDevice.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        fcmToken: {
            type: DataTypes.TEXT, // Tokens can be long
            allowNull: false,
        },
        platform: {
            type: DataTypes.ENUM('web', 'android', 'ios'),
            allowNull: false,
            defaultValue: 'web',
        },
        lastActive: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        modelName: 'UserDevice',
        tableName: 'user_devices',
        indexes: [
            {
                unique: false,
                fields: ['userId'],
            },
            {
                unique: true,
                fields: ['fcmToken'],
            },
        ],
    },
);

export default UserDevice;
