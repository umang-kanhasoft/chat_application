import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequalize';
import { SKILL_LEVEL } from './UserSkill';

export interface ProjectSkillAttributes {
    project_id: string;
    skill_id: string;
    years_of_experience: number;
    level: SKILL_LEVEL;
}

class ProjectSkill extends Model<ProjectSkillAttributes> implements ProjectSkillAttributes {
    declare project_id: string;
    declare skill_id: string;
    declare years_of_experience: number;
    declare level: SKILL_LEVEL;
}

ProjectSkill.init(
    {
        project_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        skill_id: {
            type: DataTypes.UUID,
            allowNull: false,
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
        modelName: 'ProjectSkill',
        tableName: 'project_skills',
    },
);

export default ProjectSkill;
