import { Document } from "mongoose";
import { UserRole } from "./enum";
import { IPagination } from "./pagination.interface";

export interface User extends Document {
  username: string;
  email: string;
  password: string;
  role: UserRole;
  resetPasswordToken?: string;
  resetPasswordExpiry?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserResponse {
  _id: string;
  username: string;
  email: string;
  role: UserRole;
  resetPasswordToken?: string;
  resetPasswordExpiry?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateUserInput {
  username: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface UpdateUserInput {
  username?: string;
  email?: string;
  role?: UserRole;
  password?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: UserResponse;
  token: string;
}

export interface UserQueryInput extends IPagination {
  filterModel?: any;
  sortModel?: any[];
  startRow?: number;
  endRow?: number;
}

export interface UserQueryResult {
  rowData: User[];
  rowCount: number;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
}
export { UserRole };
