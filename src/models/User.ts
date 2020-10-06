import mongoose from "mongoose";

export interface IUser extends mongoose.Document {
  name: string;
  email: string;
  password: string;
}

const userSchema = new mongoose.Schema<IUser>({
  name: String,
  email: String,
  password: String,
});

export const User = mongoose.model<IUser>("User", userSchema);
