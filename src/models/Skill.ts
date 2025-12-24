import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequalize';

export interface SkillAttributes {
    id?: string;
    name: string;
}

class Skill extends Model<SkillAttributes> implements SkillAttributes {
    declare id: string;
    declare name: string;
}

Skill.init(
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
    },
    {
        sequelize,
        modelName: 'Skill',
        tableName: 'skills',
    },
);

export default Skill;
