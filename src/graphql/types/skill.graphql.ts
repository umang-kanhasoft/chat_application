export const typeDefs = `#graphql
    type Skill {
        id: ID!
        name: String!
        createdAt: String!
        updatedAt: String!
    }

    input SkillInput {
        name: String!
    }

    extend type Query {
        skills: [Skill!]!
        skill(id: ID!): Skill
    }

    extend type Mutation {
        createSkill(data: SkillInput!): Skill!
        updateSkill(id: ID!, data: SkillInput!): Skill!
    }
`;
