import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { CreateUserInput, LoginInput } from "../interfaces/user.interface";

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const userData: CreateUserInput = req.body;
    const result = await AuthService.register(userData);
    res.status(201).json({
      message: "User created successfully",
      data: result,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(400).json({
      message: error instanceof Error ? error.message : "Registration failed",
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const loginData: LoginInput = req.body;
    const result = await AuthService.login(loginData);
    res.status(200).json({
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    res.status(401).json({
      message: error instanceof Error ? error.message : "Invalid credentials",
    });
  }
};

export const refreshToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    const result = await AuthService.refreshToken(refreshToken);
    res.status(200).json({
      message: "Token refreshed successfully",
      data: result,
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(401).json({
      message: error instanceof Error ? error.message : "Invalid refresh token",
    });
  }
};

export const requestPasswordReset = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;
    await AuthService.requestPasswordReset(email);
    res.status(200).json({
      message: "Password reset email sent successfully",
    });
  } catch (error) {
    console.error("Password reset request error:", error);
    res.status(400).json({
      message: error instanceof Error ? error.message : "Request failed",
    });
  }
};
