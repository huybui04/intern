import { Request, Response, NextFunction } from "express";
import { UserRole } from "../interfaces/enum";
import { AuthRequest } from "./auth.middleware";

export const requireRole = (roles: UserRole | UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const userRole = req.user.role as UserRole;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({
        message: "Insufficient permissions",
        required: allowedRoles,
        current: userRole,
      });
      return;
    }

    next();
  };
};

export const requireAdmin = requireRole(UserRole.ADMIN);
export const requireInstructor = requireRole(UserRole.INSTRUCTOR);
export const requireStudent = requireRole(UserRole.STUDENT);
export const requireInstructorOrAdmin = requireRole([
  UserRole.INSTRUCTOR,
  UserRole.ADMIN,
]);
export const requireStudentOrInstructor = requireRole([
  UserRole.STUDENT,
  UserRole.INSTRUCTOR,
]);
