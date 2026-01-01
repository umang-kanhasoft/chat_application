import { CreateBidInput, UpdateBidInput } from '../../graphql/schema/bid';
import Bid from '../../models/Bid';
import Project from '../../models/Project';
import ProjectSkill from '../../models/ProjectSkill';
import Skill from '../../models/Skill';
import User, { ROLES } from '../../models/User';
import UserSkill from '../../models/UserSkill';

interface BidArgs {
    id: string;
}

interface CreateBidArgs {
    data: CreateBidInput;
}

interface UpdateBidArgs {
    id: string;
    data: UpdateBidInput;
}

interface BidsByProjectIdArgs {
    project_id: string;
}

export default {
    Query: {
        bids: async () => {
            return await Bid.findAll();
        },
        bid: async (_: unknown, { id }: BidArgs) => {
            return await Bid.findByPk(id);
        },
        bidsByProjectId: async (_: unknown, { project_id }: BidsByProjectIdArgs) => {
            return await Bid.findAll({ where: { project_id } });
        },
    },

    Bid: {
        user: async (bid: Bid) => {
            return await User.findByPk(bid.user_id);
        },
        project: async (bid: Bid) => {
            return await Project.findByPk(bid.project_id);
        },
    },

    Mutation: {
        createBid: async (_: unknown, { data }: CreateBidArgs) => {
            const user = await User.findByPk(data.user_id);
            if (!user) {
                throw new Error('User not found');
            }

            if (user.role === ROLES.USER) {
                await user.update({ role: ROLES.FREELANCER });
            } else if (user.role === ROLES.CLIENT) {
                await user.update({ role: ROLES.BOTH });
            }
            const project = await Project.findByPk(data.project_id);
            if (!project) {
                throw new Error('Project not found');
            }
            return await Bid.create(data);
        },
        updateBid: async (_: unknown, { id, data }: UpdateBidArgs) => {
            if (data.user_id) {
                const user = await User.findByPk(data.user_id);
                if (!user) {
                    throw new Error('User not found');
                }

                if (user.role === ROLES.USER) {
                    await user.update({ role: ROLES.FREELANCER });
                } else if (user.role === ROLES.CLIENT) {
                    await user.update({ role: ROLES.BOTH });
                }
            }
            if (data.project_id) {
                const project = await Project.findByPk(data.project_id);
                if (!project) {
                    throw new Error('Project not found');
                }
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
