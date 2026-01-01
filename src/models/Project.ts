import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequalize';

export enum PROJECT_STATUS {
    OPEN = 'OPEN',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
}

export interface ProjectAttributes {
    id?: string;
    title: string;
    description: string;
    budget: number;
    status: PROJECT_STATUS;
    client_id: string;
    accepted_bid_id?: string;
    createdAt?: string;
    updatedAt?: string;
}

class Project extends Model<ProjectAttributes> implements ProjectAttributes {
    declare id: string;
    declare title: string;
    declare description: string;
    declare budget: number;
    declare status: PROJECT_STATUS;
    declare client_id: string;
    declare accepted_bid_id: string;
    declare createdAt: string;
    declare updatedAt: string;
}

Project.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        budget: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM(...Object.values(PROJECT_STATUS)),
            allowNull: false,
            defaultValue: PROJECT_STATUS.OPEN,
        },
        client_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        accepted_bid_id: {
            type: DataTypes.UUID,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: 'Project',
        tableName: 'projects',
    },
);

export default Project;
