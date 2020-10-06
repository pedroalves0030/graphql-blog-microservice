import mongoose from "mongoose";

export interface IComment extends mongoose.Document {
  content: string;
  postId: string;
  userId: string;
}

const CommentSchema = new mongoose.Schema<IComment>({
  content: String,
  postId: { type: mongoose.Schema.Types.ObjectId },
  userId: { type: mongoose.Schema.Types.ObjectId },
});

export const Comment = mongoose.model<IComment>("Comment", CommentSchema);
