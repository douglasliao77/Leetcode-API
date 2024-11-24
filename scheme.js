export const typeDefs = `#graphql
  type Solution {
    id: String
    title: String
    titleSlug: String
    timestamp: String
    code: String
    difficulty: String
    lang: String
  }

  type Query {
    getRecentSolutions(username: String!, authCookie: String!, limit: Int!): [Solution]
  }
`;