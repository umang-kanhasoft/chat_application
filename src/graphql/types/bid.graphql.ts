export const typeDefs = `#graphql
    type Bid {
        id: ID!
        amount: Int!
        status: String!
        user_id: ID!
        project_id: ID!
        user: User!
        project: Project!
        createdAt: String!
        updatedAt: String!
    }

    input BidInput {
        amount: Int!
        status:String!
        user_id: String!
        project_id: String!
    }

    input BidUpdateInput {
        amount: Int
        status:String
        user_id: String
        project_id: String
    }

    type Query {
        bids: [Bid!]!
        bid(id: ID!): Bid
        bidsByProjectId(project_id: ID!): [Bid!]!
    }

    type Mutation {
        createBid(data: BidInput!): Bid!
        updateBid(id: ID!, data: BidUpdateInput!): Bid!
    }
`;
