import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequalize';

export enum ROLES {
    USER = 'USER',
    CLIENT = 'CLIENT',
    FREELANCER = 'FREELANCER',
    BOTH = 'BOTH',
}

export interface UserAttributes {
    id?: string;
    name: string;
    email: string;
    role: ROLES;
    isOnline?: boolean;
    lastSeen?: Date;
}

class User extends Model<UserAttributes> implements UserAttributes {
    declare id: string;
    declare name: string;
    declare email: string;
    declare role: ROLES;
    declare isOnline: boolean;
    declare lastSeen: Date;
}

User.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        role: {
            type: DataTypes.ENUM(...Object.values(ROLES)),
            allowNull: false,
            defaultValue: ROLES.USER,
        },
        isOnline: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        lastSeen: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: 'User',
        tableName: 'users',
    },
);

export default User;
