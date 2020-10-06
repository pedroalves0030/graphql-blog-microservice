import mongoose from "mongoose";

export interface IPost extends mongoose.Document {
  content: string;
  userId: string;
}

const postSchema = new mongoose.Schema<IPost>({
  content: String,
  userId: { type: mongoose.Schema.Types.ObjectId },
});

export const Post = mongoose.model<IPost>("Post", postSchema);
