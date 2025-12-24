import Bid from '../../models/Bid';
import Message from '../../models/Message';
import Project from '../../models/Project';
import ProjectSkill from '../../models/ProjectSkill';
import Skill from '../../models/Skill';
import User from '../../models/User';
import UserSkill from '../../models/UserSkill';

export const getUserById = async (id: string) => {
    const user = await User.findByPk(id, {
        include: [
            {
                model: UserSkill,
                as: 'user_skills',
                include: [{ model: Skill, as: 'skill' }],
            },
            {
                model: Project,
                as: 'authoredProjects',
                include: [
                    {
                        model: ProjectSkill,
                        as: 'project_skills',
                        include: [{ model: Skill, as: 'skill' }],
                    },
                ],
            },
            {
                model: Bid,
                as: 'bids',
                include: [
                    {
                        model: Project,
                        as: 'project',
                        include: [
                            {
                                model: ProjectSkill,
                                as: 'project_skills',
                                include: [{ model: Skill, as: 'skill' }],
                            },
                        ],
                    },
                ],
            },
            {
                model: Message,
                as: 'sendMessage',
                include: [
                    { model: User, as: 'receiver' },
                    { model: Project, as: 'project' },
                ],
            },
            {
                model: Message,
                as: 'receivedMessage',
                include: [
                    { model: User, as: 'sender' },
                    { model: Project, as: 'project' },
                ],
            },
        ],
    });
    return user;
};
