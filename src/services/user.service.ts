import { UserModel, UserMongooseModel } from "../models/User";
import { UpdateUserInput, UserResponse } from "../interfaces/user.interface";
import { UserRole } from "../interfaces/enum";
import { hashPassword } from "../utils/bcrypt.utils";
import { IFilter } from "../interfaces/filter.interface";
import { ISort } from "../interfaces/sort.interface";
import { IPagination } from "../interfaces/pagination.interface";

// Chuẩn hóa input cho ag-Grid query
export interface UserQueryInput extends IPagination {
  sort?: ISort[];
  filter?: IFilter[];
  search?: string;
}

export interface UserQueryResult {
  data: UserResponse[];
  total: number;
}

export class UserService {
  static async getUsers(query: UserQueryInput): Promise<UserQueryResult> {
    const mongoFilter: any = {};
    if (query.filter && query.filter.length > 0) {
      for (const f of query.filter) {
        switch (f.operator) {
          case "eq":
            mongoFilter[f.field] = f.value;
            break;
          case "ne":
            mongoFilter[f.field] = { $ne: f.value };
            break;
          case "lt":
            mongoFilter[f.field] = { $lt: f.value };
            break;
          case "lte":
            mongoFilter[f.field] = { $lte: f.value };
            break;
          case "gt":
            mongoFilter[f.field] = { $gt: f.value };
            break;
          case "gte":
            mongoFilter[f.field] = { $gte: f.value };
            break;
          case "in":
            mongoFilter[f.field] = { $in: f.value };
            break;
          case "nin":
            mongoFilter[f.field] = { $nin: f.value };
            break;
          case "regex":
            mongoFilter[f.field] = { $regex: f.value, $options: "i" };
            break;
        }
      }
    }
    if (query.search) {
      mongoFilter.$or = [
        { username: { $regex: query.search, $options: "i" } },
        { email: { $regex: query.search, $options: "i" } },
      ];
    }
    let sortObj: any = {};
    if (query.sort && query.sort.length > 0) {
      for (const s of query.sort) {
        sortObj[s.field] = s.direction === "asc" ? 1 : -1;
      }
    } else {
      sortObj = { createdAt: -1 };
    }
    const startRow = query.startRow ?? 0;
    const endRow = query.endRow ?? 20;
    const skip = startRow;
    const [users, total] = await Promise.all([
      UserModel.findWithQuery(mongoFilter, sortObj, skip, endRow - startRow),
      UserModel.countWithQuery(mongoFilter),
    ]);
    const data = users.map((user) => ({
      _id: (user._id as any).toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      resetPasswordToken: user.resetPasswordToken,
      resetPasswordExpiry: user.resetPasswordExpiry,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
    return { data, total };
  }
  static async getAllUsers(
    filters: IFilter[] = [],
    sorts: ISort[] = [],
    pagination: IPagination = {}
  ): Promise<{ data: UserResponse[]; totalCount: number }> {
    const mongoFilter: any = {};
    for (const filter of filters) {
      switch (filter.operator) {
        case "eq":
          mongoFilter[filter.field] = filter.value;
          break;
        case "ne":
          mongoFilter[filter.field] = { $ne: filter.value };
          break;
        case "lt":
          mongoFilter[filter.field] = { $lt: filter.value };
          break;
        case "lte":
          mongoFilter[filter.field] = { $lte: filter.value };
          break;
        case "gt":
          mongoFilter[filter.field] = { $gt: filter.value };
          break;
        case "gte":
          mongoFilter[filter.field] = { $gte: filter.value };
          break;
        case "in":
          mongoFilter[filter.field] = { $in: filter.value };
          break;
        case "nin":
          mongoFilter[filter.field] = { $nin: filter.value };
          break;
        case "regex":
          mongoFilter[filter.field] = { $regex: filter.value, $options: "i" };
          break;
        default:
          break;
      }
    }

    // Build sort object
    const mongoSort: any = {};
    for (const sort of sorts) {
      mongoSort[sort.field] = sort.direction === "asc" ? 1 : -1;
    }

    const startRow = pagination.startRow ?? 0;
    const endRow = pagination.endRow ?? 20;
    const totalCount = await UserMongooseModel.countDocuments(mongoFilter);
    const skip = startRow;
    const users = await UserMongooseModel.find(mongoFilter)
      .sort(mongoSort)
      .skip(skip)
      .limit(endRow - startRow)
      .select("-password")
      .lean();

    const data = users.map((user) => ({
      _id: (user._id as any).toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      resetPasswordToken: user.resetPasswordToken,
      resetPasswordExpiry: user.resetPasswordExpiry,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    return { data, totalCount };
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
