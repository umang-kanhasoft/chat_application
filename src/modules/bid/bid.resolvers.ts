import { CreateBidInput, UpdateBidInput } from '../../graphql/schema/bid';
import Bid from '../../models/Bid';
import Project from '../../models/Project';
import ProjectSkill from '../../models/ProjectSkill';
import Skill from '../../models/Skill';
import User, { ROLES } from '../../models/User';
import UserSkill from '../../models/UserSkill';

export default {
    Query: {
        bids: async () => {
            return await Bid.findAll();
        },
        bid: async (_: any, { id }: { id: string }) => {
            return await Bid.findByPk(id, {
                include: [
                    {
                        model: User,
                        as: 'user',
                        include: [
                            {
                                model: UserSkill,
                                as: 'user_skills',
                                include: [
                                    {
                                        model: Skill,
                                        as: 'skill',
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        model: Project,
                        as: 'project',
                        include: [
                            {
                                model: ProjectSkill,
                                as: 'project_skills',
                                include: [
                                    {
                                        model: Skill,
                                        as: 'skill',
                                    },
                                ],
                            },
                        ],
                    },
                ],
            });
        },
    },

    Mutation: {
        createBid: async (_: any, { data }: { data: CreateBidInput }) => {
            const user = await User.findByPk(data.user_id);
            if (!user || ![ROLES.FREELANCER].includes(user.role)) {
                throw new Error('User not found');
            }
            const project = await Project.findByPk(data.project_id);
            if (!project) {
                throw new Error('Project not found');
            }
            return await Bid.create(data);
        },
        updateBid: async (_: any, { id, data }: { id: string; data: UpdateBidInput }) => {
            const user = await User.findByPk(data.user_id);
            if (!user || ![ROLES.FREELANCER].includes(user.role)) {
                throw new Error('User not found');
            }
            const project = await Project.findByPk(data.project_id);
            if (!project) {
                throw new Error('Project not found');
            }
            const bid = await Bid.findByPk(id);
            if (!bid) {
                throw new Error('Bid not found');
            }
            await bid.update(data);
            return bid;
        },
    },
};
