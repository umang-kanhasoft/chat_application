export const typeDefs = `#graphql
    type ProjectSkill {
        project_id: ID!
        skill_id: ID!
        skill: Skill
        years_of_experience: Int!
        level:String!
        createdAt: String!
        updatedAt: String!
    }

    input ProjectSkillInput {
        project_id: ID!
        skill_id: ID!
        years_of_experience: Int!
        level:String!
    }

    extend type Query {
        projectSkill(id: ID!): ProjectSkill
    }

    extend type Mutation {
        createProjectSkill(data: ProjectSkillInput!): ProjectSkill!
        updateProjectSkill(id: ID!, data: ProjectSkillInput!): ProjectSkill!
    }

`;
