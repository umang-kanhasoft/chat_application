import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequalize';

export enum MESSAGE_STATUS {
    SENT = 'SENT',
    DELIVERED = 'DELIVERED',
    READ = 'READ',
}

export interface MessageAttributes {
    id?: string;
    content: string;
    sender_id: string;
    receiver_id: string;
    project_id: string | null;
    replyToId?: string | null;
    reactions?: any[];
    status: MESSAGE_STATUS;
    createdAt?: string;
    updatedAt?: string;
}

class Message extends Model<MessageAttributes> implements MessageAttributes {
    declare id: string;
    declare content: string;
    declare sender_id: string;
    declare receiver_id: string;
    declare project_id: string | null;
    declare replyToId: string | null;
    declare reactions: any[]; // JSONB
    declare status: MESSAGE_STATUS;
    declare createdAt: string;
    declare updatedAt: string;
}

Message.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        content: {
            type: DataTypes.TEXT,
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
            allowNull: true,
        },
        replyToId: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        reactions: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: [],
        },
        status: {
            type: DataTypes.ENUM(...Object.values(MESSAGE_STATUS)),
            allowNull: false,
            defaultValue: MESSAGE_STATUS.SENT,
        },
    },
    {
        sequelize,
        modelName: 'Message',
        tableName: 'messages',
    },
);

export default Message;
