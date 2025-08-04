import { UserMongooseModel } from "../models/User";
import {
  CreateUserInput,
  LoginInput,
  AuthResponse,
} from "../interfaces/user.interface";
import { UserRole } from "../interfaces/enum";
import { hashPassword, comparePassword } from "../utils/bcrypt.utils";
import { JWTUtils } from "../utils/jwt.utils";
import {
  generateResetToken,
  generateResetTokenExpiry,
} from "../utils/token.utils";
import redisClient from "./redis.config";
import { TOKEN_CACHE_PREFIX } from "../shared/constants";

export class AuthService {
  static async register(userData: CreateUserInput): Promise<AuthResponse> {
    if (!userData.username || !userData.email || !userData.password) {
      throw new Error("All fields are required");
    }

    if (userData.password.length < 6) {
      throw new Error("Password must be at least 6 characters long");
    }

    const existingUser = await UserMongooseModel.findOne({
      email: userData.email,
    });
    if (existingUser) {
      throw new Error("User already exists with this email");
    }

    const hashedPassword = await hashPassword(userData.password);

    const newUser = await UserMongooseModel.create({
      ...userData,
      password: hashedPassword,
      role: userData.role || UserRole.STUDENT,
    });

    // Generate tokens
    const tokenPayload = {
      userId: (newUser._id as any).toString(),
      email: newUser.email,
      role: newUser.role,
    };

    const tokens = JWTUtils.generateTokens(tokenPayload);

    // Return user without password
    const userWithoutPassword = newUser.toObject();
    const { password, ...userResponse } = userWithoutPassword;

    return {
      user: {
        _id: (newUser._id as any).toString(),
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        resetPasswordToken: newUser.resetPasswordToken,
        resetPasswordExpiry: newUser.resetPasswordExpiry,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      },
      token: tokens.accessToken,
    };
  }

  static async login(loginData: LoginInput): Promise<AuthResponse> {
    // Validate input
    if (!loginData.email || !loginData.password) {
      throw new Error("Email and password are required");
    }

    // Find user by email
    const user = await UserMongooseModel.findOne({ email: loginData.email });
    if (!user) {
      throw new Error("Invalid email or password");
    }

    // Check password
    const isPasswordValid = await comparePassword(
      loginData.password,
      user.password
    );
    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    // Generate tokens
    const tokenPayload = {
      userId: (user._id as any).toString(),
      email: user.email,
      role: user.role,
    };

    const tokens = JWTUtils.generateTokens(tokenPayload);

    return {
      user: {
        _id: (user._id as any).toString(),
        username: user.username,
        email: user.email,
        role: user.role,
        resetPasswordToken: user.resetPasswordToken,
        resetPasswordExpiry: user.resetPasswordExpiry,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token: tokens.accessToken,
    };
  }

  static async logout(token: string): Promise<void> {
    await AuthService.removeTokenFromCache(token);
  }

  static async refreshToken(
    refreshToken: string
  ): Promise<{ accessToken: string }> {
    if (!refreshToken) {
      throw new Error("Refresh token is required");
    }

    const payload = JWTUtils.verifyRefreshToken(refreshToken);
    if (!payload) {
      throw new Error("Invalid refresh token");
    }

    // Verify user still exists
    const user = await UserMongooseModel.findById(payload.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Generate new access token
    const newAccessToken = JWTUtils.generateAccessToken({
      userId: (user._id as any).toString(),
      email: user.email,
      role: user.role,
    });

    return { accessToken: newAccessToken };
  }

  static async requestPasswordReset(email: string): Promise<void> {
    if (!email) {
      throw new Error("Email is required");
    }

    const user = await UserMongooseModel.findOne({ email });
    if (!user) {
      throw new Error("User not found");
    }

    const resetToken = generateResetToken();
    const resetTokenExpiry = generateResetTokenExpiry();

    await UserMongooseModel.findByIdAndUpdate(user._id, {
      resetPasswordToken: resetToken,
      resetPasswordExpiry: resetTokenExpiry,
    });

    // In a real app, you would send an email here
    // For now, just return the token (remove this in production)
    console.log(`Password reset token for ${email}: ${resetToken}`);
  }

  static async resetPassword(
    token: string,
    newPassword: string
  ): Promise<void> {
    const user = await UserMongooseModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: new Date() },
    });
    if (!user) throw new Error("Invalid or expired reset token");

    const hashedPassword = await hashPassword(newPassword);
    await UserMongooseModel.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpiry: null,
    });
  }

  static async removeTokenFromCache(token: string): Promise<void> {
    const cacheKey = `${TOKEN_CACHE_PREFIX}${token}`;
    await redisClient.del(cacheKey);
  }
}
