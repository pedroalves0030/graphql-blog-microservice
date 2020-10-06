import {
  ApolloServer,
  gql,
  IResolvers,
  ApolloError,
  AuthenticationError,
  UserInputError,
  ForbiddenError,
} from "apollo-server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { User } from "./models/User";
import { Post } from "./models/Post";
import { Comment } from "./models/Comment";

const JWT_SECRET = process.env.JWT_SECRET || "secret";

const resolvers: IResolvers = {
  User: {
    posts(user, args, context, info) {
      return Post.find({ userId: user.id });
    },
  },
  Post: {
    comments(post, args, context, info) {
      return Comment.find({ postId: post.id });
    },
  },
  Comment: {
    async author(comment, args, context, info) {
      return User.findOne({ _id: comment.userId });
    },
    async post(comment, args, context, info) {
      return Post.findOne({ _id: comment.postId });
    },
  },
  Query: {
    user(_, args, context) {
      return context.user;
    },
    userById(_, args, context, info) {
      return User.findOne({ _id: context.user.id });
    },
    postById(_, args, context, info) {
      return Post.findOne({ _id: args.id });
    },
    users(_, args, context, info) {
      return User.find({}).limit(Math.min(args.first, 50)).skip(args.after);
    },
    posts(_, args, context, info) {
      return Post.find({}).limit(Math.min(args.first, 50)).skip(args.after);
    },
    countUsers() {
      return User.countDocuments({});
    },
    countPosts() {
      return Post.countDocuments({});
    },
  },
  Mutation: {
    async signup(_, args, context, info) {
      try {
        const prevUser = await User.findOne({ email: args.email });

        if (prevUser) {
          throw new UserInputError(
            "There's already an user registered with this email"
          );
        }

        const hash = bcrypt.hashSync(args.password, 12);
        await User.create({
          email: args.email,
          name: args.name,
          password: hash,
        });

        return true;
      } catch (err) {
        throw new ApolloError("Please validate your input", "400");
      }
    },
    async login(_, args, context, info) {
      const user = await User.findOne({ email: args.email });

      if (!user) {
        throw new AuthenticationError(
          "Couldn't find an user associated with this email"
        );
      }

      const isValid = bcrypt.compareSync(args.password, user.password);

      if (!isValid) {
        throw new AuthenticationError("Please verifiy your password");
      }

      return {
        user,
        token: jwt.sign({}, JWT_SECRET, { subject: user.id, expiresIn: "1d" }),
      };
    },
    async deleteAccount(_, args, context, info) {
      if (!context.user) throw new ForbiddenError("Please provide a JWT");
      await User.deleteOne(context.user.id);
      await Post.deleteMany({ userId: context.user.id });
      await Comment.deleteMany({ userId: context.user.id });
      return true;
    },
    async createPost(_, args, context, info) {
      if (!context.user) throw new ForbiddenError("Please provide a JWT");
      return Post.create({ content: args.content, userId: context.user.id });
    },
    async updatePost(_, args, context, info) {
      if (!context.user) throw new ForbiddenError("Please provide a JWT");
      await Post.updateOne(
        { _id: args.id, userId: context.user.id },
        { content: args.content }
      );
      return Post.findOne({ _id: args.id });
    },
    async deletePost(_, args, context, info) {
      if (!context.user) throw new ForbiddenError("Please provide a JWT");
      await Post.deleteOne({ _id: args.id, userId: context.user.id });
      return true;
    },
    async createComment(_, args, context, info) {
      if (!context.user) throw new ForbiddenError("Please provide a JWT");
      return Comment.create({
        postId: args.postId,
        content: args.content,
        userId: context.user.id,
      });
    },
    async updateComment(_, args, context, info) {
      if (!context.user) throw new ForbiddenError("Please provide a JWT");
      await Comment.updateOne(
        { _id: args.id, userId: context.user.id },
        { content: args.content }
      );
      return Comment.findOne({ _id: args.id });
    },
    async deleteComment(_, args, context, info) {
      if (!context.user) throw new ForbiddenError("Please provide a JWT");
      await Comment.deleteOne({ _id: args.id, userId: context.user.id });
      return true;
    },
  },
};

const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String!
    posts: [Post!]!
  }

  type Post {
    id: ID!
    content: String!
    comments: [Comment!]!
  }

  type Comment {
    id: ID!
    content: String!
    author: User!
    post: Post!
  }

  type LoginReponse {
    user: User!
    token: String!
  }

  type Query {
    """
    Return the current logged in user
    """
    user: User

    """
    Find a single user by id
    """
    userById(id: ID!): User

    """
    Find a single post by id
    """
    postById(id: ID!): Post

    """
    List all user
    """
    users(first: Int, after: Int): [User!]!

    """
    List all posts
    """
    posts(first: Int, after: Int): [Post!]!

    """
    Count all created posts
    """
    countPosts: Int!

    """
    Count all created users
    """
    countUsers: Int!
  }

  type Mutation {
    """
    Sign up a new user
    """
    signup(name: String!, email: String!, password: String!): Boolean!

    """
    Login and retrieve access token
    """
    login(email: String!, password: String!): LoginReponse!

    """
    Delete user and all related information
    """
    deleteAccount: Boolean!

    """
    Create a new post
    """
    createPost(content: String!): Post!

    """
    Update an existing post created by the user
    """
    updatePost(id: ID!, content: String!): Post!

    """
    Delete a post created by the user
    """
    deletePost(id: ID!): Boolean!

    """
    Comment a post
    """
    createComment(postId: ID!, content: String!): Comment!
    """
    Update an existing comment created by the user
    """
    updateComment(id: ID!, content: String!): Comment!

    """
    Delete a comment created by the user
    """
    deleteComment(id: ID!): Boolean!
  }
`;

const app = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const token = req.headers.authorization?.replace("Bearer ", "") || "";

    if (token) {
      const { sub } = jwt.verify(token, JWT_SECRET) as { sub: string };

      const user = await User.findOne({ _id: sub });

      if (!user)
        throw new AuthenticationError("Please verify if your JWT is valid");

      return { user };
    }
  },
});

export default app;
