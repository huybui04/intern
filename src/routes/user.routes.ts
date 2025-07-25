import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  changePassword,
  updateUserRole,
} from "../controllers/user.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import {
  requireAdmin,
  requireInstructorOrAdmin,
} from "../middlewares/roles.middleware";

const userRouter = Router();

userRouter.use(authenticateToken);

userRouter.get("/", requireAdmin, getAllUsers);

userRouter.get("/:id", getUserById);

userRouter.put("/:id", requireInstructorOrAdmin, updateUser);

userRouter.delete("/:id", requireAdmin, deleteUser);

userRouter.patch("/:id/password", changePassword);

userRouter.patch("/:id/role", requireAdmin, updateUserRole);

export default userRouter;
