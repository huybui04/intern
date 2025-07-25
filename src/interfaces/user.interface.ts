import { Document, Types } from "mongoose";
import { UserRole } from "./enum";

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

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
}
export { UserRole };
