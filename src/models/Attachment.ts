import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequalize';

export interface AttachmentsAttributes {
    id?: string;
    message_id: string;
    file_name: string;
    file_size: number;
    mime_type: string;
    storage_key: string;
    public_id?: string;
    checksum: string;
    url: string;
}

class Attachment extends Model<AttachmentsAttributes> implements AttachmentsAttributes {
    declare id: string;
    declare message_id: string;
    declare file_name: string;
    declare file_size: number;
    declare mime_type: string;
    declare storage_key: string;
    declare public_id: string;
    declare checksum: string;
    declare url: string;
}

Attachment.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        message_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        file_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        file_size: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        mime_type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        storage_key: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        public_id: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        checksum: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        url: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        sequelize,
        modelName: 'Attachment',
        tableName: 'attachments',
    },
);

export default Attachment;
