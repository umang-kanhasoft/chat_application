import Attachment from './Attachment';
import Bid from './Bid';
import Message from './Message';
import Project from './Project';
import ProjectSkill from './ProjectSkill';
import Skill from './Skill';
import User from './User';
import UserSkill from './UserSkill';
import UserToken from './UserToken';

const models = {
    User,
    Skill,
    UserSkill,
    Project,
    ProjectSkill,
    Bid,
    Message,
    Attachment,
    UserToken,
};

// User <-> Skill (Many-To-Many through UserSkill)
User.belongsToMany(Skill, { through: UserSkill, foreignKey: 'user_id', as: 'skills' });
Skill.belongsToMany(User, { through: UserSkill, foreignKey: 'skill_id' });

// User <-> UserSkill (One-To-Many)
User.hasMany(UserSkill, { foreignKey: 'user_id', as: 'user_skills' });
UserSkill.belongsTo(User, { foreignKey: 'user_id' });

// UserSkill <-> Skill
UserSkill.belongsTo(Skill, { foreignKey: 'skill_id', as: 'skill' });

// User <-> Project (Client)
User.hasMany(Project, { foreignKey: 'client_id', as: 'authoredProjects' });
Project.belongsTo(User, { foreignKey: 'client_id', as: 'client' });

// Messages
User.hasMany(Message, { foreignKey: 'sender_id', as: 'sendMessage' });
User.hasMany(Message, { foreignKey: 'receiver_id', as: 'receivedMessage' });
Message.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });
Message.belongsTo(User, { foreignKey: 'receiver_id', as: 'receiver' });

// Message <-> Attachment
Message.hasMany(Attachment, { foreignKey: 'message_id', as: 'attachments' });
Attachment.belongsTo(Message, { foreignKey: 'message_id', as: 'message' });

// Message Reply (Self-Referential)
Message.belongsTo(Message, { foreignKey: 'replyToId', as: 'replyTo' });

// User <-> Bid
User.hasMany(Bid, { foreignKey: 'user_id', as: 'bids' });
Bid.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Project <-> Skill (Many-To-Many through ProjectSkill)
Project.belongsToMany(Skill, {
    through: ProjectSkill,
    foreignKey: 'project_id',
    as: 'requirements',
});
Skill.belongsToMany(Project, { through: ProjectSkill, foreignKey: 'skill_id' });

// Project <-> ProjectSkill (One-To-Many)
Project.hasMany(ProjectSkill, { foreignKey: 'project_id', as: 'project_skills' });
ProjectSkill.belongsTo(Project, { foreignKey: 'project_id' });

// UserSkill <-> Skill
ProjectSkill.belongsTo(Skill, { foreignKey: 'skill_id', as: 'skill' });

// Project <-> Message
Project.hasMany(Message, { foreignKey: 'project_id', as: 'messages' });
Message.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });

// Project <-> Bid
Project.hasMany(Bid, { foreignKey: 'project_id', as: 'bids' });
Bid.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });

// Selected bid
Project.belongsTo(Bid, { foreignKey: 'accepted_bid_id', as: 'acceptedBid', constraints: false });

export default models;
