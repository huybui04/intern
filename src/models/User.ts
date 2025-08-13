import { Schema, model, Model } from "mongoose";
import { User } from "../interfaces/user.interface";
import { EUserRole } from "../interfaces/enum";

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
      enum: Object.values(EUserRole),
      default: EUserRole.STUDENT,
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
  static async findAll(
    skip: number,
    limit: number,
    filter?: any,
    sort?: any
  ): Promise<{ data: User[]; totalCount: number }> {
    const totalCount = await UserMongooseModel.countDocuments();
    const data = await UserMongooseModel.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);
    return { data, totalCount };
  }

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
