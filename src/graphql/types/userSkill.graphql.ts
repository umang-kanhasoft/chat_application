export const typeDefs = `#graphql
    type UserSkill {
        user_id: ID!
        skill_id: ID!
        skill: Skill
        years_of_experience: Int!
        level:String!
        createdAt: String!
        updatedAt: String!
    }

    input UserSkillInput {
        user_id: ID!
        skill_id: ID!
        years_of_experience: Int!
        level:String!
    }

    extend type Query {
        userSkill(id: ID!): UserSkill
        userSkillsByUserId(user_id: ID!): [UserSkill!]!
    }

    extend type Mutation {
        createUserSkill(data: UserSkillInput!): UserSkill!
        updateUserSkill(id: ID!, data: UserSkillInput!): UserSkill!
    }
`;
