export const typeDefs = `#graphql
    type Project {
        id: ID!
        title: String!
        description: String!
        budget: Int!
        status: String!
        client_id: ID!
        project_skills: [ProjectSkill!]
        bids: [Bid!]
        createdAt: String!
        updatedAt: String!
    }

    input ProjectInput {
        title: String!
        description:String!
        budget: Int!
        status: String!
        client_id: String!
    }

    type Query {
        projects: [Project!]!
        project(id: ID!): Project
    }

    type Mutation {
        createProject(data: ProjectInput!): Project!
        updateProject(id: ID!, data: ProjectInput!): Project!
    }

`;
