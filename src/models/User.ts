import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequalize';

export enum ROLES {
    CLIENT = 'CLIENT',
    FREELANCER = 'FREELANCER',
    BOTH = 'BOTH',
}

export interface UserAttributes {
    id?: string;
    name: string;
    email: string;
    role: ROLES;
}

class User extends Model<UserAttributes> implements UserAttributes {
    declare id: string;
    declare name: string;
    declare email: string;
    declare role: ROLES;
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
            defaultValue: ROLES.FREELANCER,
        },
    },
    {
        sequelize,
        modelName: 'User',
        tableName: 'users',
    },
);

export default User;
