import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequalize';

export interface MessageAttributes {
    id?: string;
    content: string;
    sender_id: string;
    receiver_id: string;
    project_id: string;
}

class Message extends Model<MessageAttributes> implements MessageAttributes {
    declare id: string;
    declare content: string;
    declare sender_id: string;
    declare receiver_id: string;
    declare project_id: string;
}

Message.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        content: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        sender_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        receiver_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        project_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
    },
    {
        sequelize,
        modelName: 'Message',
        tableName: 'messages',
    },
);

export default Message;
