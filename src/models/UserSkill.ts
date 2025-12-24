import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequalize';

export enum SKILL_LEVEL {
    BEGINNER = 'BEGINNER',
    INTERMEDIATE = 'INTERMEDIATE',
    ADVANCED = 'ADVANCED',
}

export interface UserSkillAttributes {
    user_id: string;
    skill_id: string;
    years_of_experience: number;
    level: SKILL_LEVEL;
}

class UserSkill extends Model<UserSkillAttributes> implements UserSkillAttributes {
    declare user_id: string;
    declare skill_id: string;
    declare years_of_experience: number;
    declare level: SKILL_LEVEL;
}

UserSkill.init(
    {
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'users', key: 'id' },
        },
        skill_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'skills', key: 'id' },
        },
        years_of_experience: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        level: {
            type: DataTypes.ENUM(...Object.values(SKILL_LEVEL)),
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: 'UserSkill',
        tableName: 'user_skills',
    },
);

export default UserSkill;
