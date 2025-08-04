import { Router } from "express";
import {
  register,
  login,
  refreshToken,
  requestPasswordReset,
  logout,
  resetPassword,
} from "../controllers/auth.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const authRouter = Router();

// Public routes
authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/refresh-token", refreshToken);
authRouter.post("/forgot-password", requestPasswordReset);
authRouter.post("/reset-password", resetPassword);

// Protected routes
authRouter.post("/logout", authenticateToken, logout);

export default authRouter;
