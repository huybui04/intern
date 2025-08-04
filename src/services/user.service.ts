import { UserModel, UserMongooseModel } from "../models/User";
import {
  UpdateUserInput,
  UserQueryInput,
  UserQueryResult,
  UserResponse,
} from "../interfaces/user.interface";
import { UserRole } from "../interfaces/enum";
import { hashPassword } from "../utils/bcrypt.utils";
import { filterToMongo } from "../utils/filterToMongo";
import { SortToMongo } from "../utils/sortToMongo";
import { DEFAULT_END_ROW, DEFAULT_START_ROW } from "../shared/constants";

export class UserService {
  static async getAllUsers(query: UserQueryInput): Promise<UserQueryResult> {
    const { filterModel, sortModel } = query;

    const mongoFilter = filterToMongo(filterModel);
    const mongoSort = SortToMongo(sortModel ?? []);

    const startRow = query.startRow ?? DEFAULT_START_ROW;
    const endRow = query.endRow ?? DEFAULT_END_ROW;
    const skip = startRow;
    const limit = endRow - startRow;

    const result = await UserModel.findAll(skip, limit, mongoFilter, mongoSort);
    return {
      rowData: result.data,
      rowCount: result.totalCount,
    };
  }

  static async getUserById(id: string): Promise<UserResponse | null> {
    if (!id) {
      throw new Error("User ID is required");
    }

    const user = await UserMongooseModel.findById(id)
      .select("-password")
      .lean();
    if (!user) {
      return null;
    }

    return {
      _id: (user._id as any).toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      resetPasswordToken: user.resetPasswordToken,
      resetPasswordExpiry: user.resetPasswordExpiry,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  static async updateUser(
    id: string,
    updates: UpdateUserInput
  ): Promise<UserResponse | null> {
    if (!id) {
      throw new Error("User ID is required");
    }

    if (!updates || Object.keys(updates).length === 0) {
      throw new Error("Update data is required");
    }

    const updatedUser = await UserMongooseModel.findByIdAndUpdate(id, updates, {
      new: true,
    })
      .select("-password")
      .lean();

    if (!updatedUser) {
      return null;
    }

    return {
      _id: (updatedUser._id as any).toString(),
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      resetPasswordToken: updatedUser.resetPasswordToken,
      resetPasswordExpiry: updatedUser.resetPasswordExpiry,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };
  }

  static async deleteUser(id: string): Promise<boolean> {
    if (!id) {
      throw new Error("User ID is required");
    }

    const result = await UserMongooseModel.findByIdAndDelete(id);
    return !!result;
  }

  static async updateUserRole(
    id: string,
    role: UserRole
  ): Promise<UserResponse | null> {
    if (!id) {
      throw new Error("User ID is required");
    }

    if (!role || !Object.values(UserRole).includes(role)) {
      throw new Error("Valid role is required");
    }

    return await this.updateUser(id, { role });
  }

  static async changePassword(id: string, newPassword: string): Promise<void> {
    if (!id) {
      throw new Error("User ID is required");
    }

    if (!newPassword) {
      throw new Error("New password is required");
    }

    if (newPassword.length < 6) {
      throw new Error("Password must be at least 6 characters long");
    }

    const hashedPassword = await hashPassword(newPassword);
    await UserMongooseModel.findByIdAndUpdate(id, { password: hashedPassword });
  }

  static async getUserByEmail(email: string): Promise<UserResponse | null> {
    if (!email) {
      throw new Error("Email is required");
    }

    const user = await UserMongooseModel.findOne({ email })
      .select("-password")
      .lean();
    if (!user) {
      return null;
    }

    return {
      _id: (user._id as any).toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      resetPasswordToken: user.resetPasswordToken,
      resetPasswordExpiry: user.resetPasswordExpiry,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
