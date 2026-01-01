import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequalize';

interface UserTokenAttributes {
    id: string;
    userId: string;
    tokenType: 'ACCESS' | 'REFRESH';
    token: string;
    expiresAt: Date;
}

class UserToken extends Model<UserTokenAttributes> implements UserTokenAttributes {
    declare id: string;
    declare userId: string;
    declare tokenType: 'ACCESS' | 'REFRESH';
    declare token: string;
    declare expiresAt: Date;
}

UserToken.init(
    {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        userId: { type: DataTypes.UUID, allowNull: false },
        tokenType: { type: DataTypes.ENUM('ACCESS', 'REFRESH'), allowNull: false },
        token: { type: DataTypes.TEXT, allowNull: false }, // store hashed
        expiresAt: { type: DataTypes.DATE, allowNull: false },
    },
    { sequelize, modelName: 'UserToken', tableName: 'user_tokens' },
);

export default UserToken;
