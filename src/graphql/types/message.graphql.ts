export const typeDefs = `#graphql
    type Reaction {
        emoji: String!
        count: Int!
        userIds: [ID!]!
    }

    type Message {
        id: ID!
        content: String!
        sender_id: ID!
        sender: User!
        receiver_id: ID!
        receiver: User!
        project_id: ID!
        replyToId: ID
        replyTo: Message
        reactions: [Reaction]
        project: Project!
        createdAt: String!
        updatedAt: String!
    }

    input MessageInput {
        content: String!
        sender_id: ID!
        receiver_id: ID!
        project_id: ID!
        replyToId: ID
    }

    type Query {
        messages: [Message!]!
        message(id: ID!): Message
    }

    type Mutation {
        createMessage(data: MessageInput!): Message!
        updateMessage(id: ID!, data: MessageInput!): Message!
        addReaction(messageId: ID!, emoji: String!): Message!
    }
`;
