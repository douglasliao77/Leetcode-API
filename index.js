import express from 'express';
import rateLimit from 'express-rate-limit';
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { typeDefs } from './scheme.js' // Types
import fetchUserSubmissions from './resolver.js'; // Resolvers



const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, try again later :).',
});


const app = express();
app.use(limiter);


const resolvers = {
  Query: {
    getRecentSolutions: async (_, { username, authCookie, limit }) => {
      const recentSubmissions = await fetchUserSubmissions(
        username, 
        authCookie, 
        limit
      );
      return recentSubmissions;
    }
  }
};

// Server setup
const server = new ApolloServer({
    typeDefs, 
    resolvers
})

const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 }
})