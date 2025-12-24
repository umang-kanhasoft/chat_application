export const typeDefs = `#graphql
    type User {
        id: ID!
        name: String!
        email:String!
        role:String!
        user_skills: [UserSkill!]
        authoredProjects: [Project!]
        sendMessage: [Message!]
        receivedMessage: [Message!]
        bids: [Bid!]
        createdAt: String!
        updatedAt: String!
    }

    input UserInput {
        name: String!
        email:String!
        role:String!
    }

    type Query {
        users: [User!]!
        user(id: ID!): User
    }

    type Mutation {
        createUser(data: UserInput!): User!
        updateUser(id: ID!, data: UserInput!): User!
    }
`;
