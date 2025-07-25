import { Schema, model, Model } from "mongoose";
import { User } from "../interfaces/user.interface";
import { UserRole } from "../interfaces/enum";

const userSchema = new Schema<User>(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.STUDENT,
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpiry: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const UserMongooseModel: Model<User> = model<User>("User", userSchema);

export class UserModel {
  static async findWithQuery(
    filter: any,
    sort: any,
    skip: number,
    limit: number
  ) {
    return UserMongooseModel.find(filter).sort(sort).skip(skip).limit(limit);
  }
  static async countWithQuery(filter: any) {
    return UserMongooseModel.countDocuments(filter);
  }
}
