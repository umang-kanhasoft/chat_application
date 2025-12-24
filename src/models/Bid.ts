import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequalize';

export enum BID_STATUS {
    PENDING = 'PENDING',
    REJECTED = 'REJECTED',
    ACCEPTED = 'ACCEPTED',
}

export interface BidsAttributes {
    id?: string;
    amount: number;
    status: BID_STATUS;
    user_id: string;
    project_id: string;
}

class Bid extends Model<BidsAttributes> implements BidsAttributes {
    declare id: string;
    declare amount: number;
    declare status: BID_STATUS;
    declare user_id: string;
    declare project_id: string;
}

Bid.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        amount: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM(...Object.values(BID_STATUS)),
            allowNull: false,
            defaultValue: BID_STATUS.PENDING,
        },
        user_id: {
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
        modelName: 'Bid',
        tableName: 'bids',
    },
);

export default Bid;
