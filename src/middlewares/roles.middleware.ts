import { Response, NextFunction } from "express";
import { EUserRole } from "../interfaces/enum";
import { AuthRequest } from "./auth.middleware";

export const requireRole = (roles: EUserRole | EUserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const userRole = req.user.role as EUserRole;
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

export const requireAdmin = requireRole(EUserRole.ADMIN);
export const requireInstructor = requireRole(EUserRole.INSTRUCTOR);
export const requireStudent = requireRole(EUserRole.STUDENT);
export const requireInstructorOrAdmin = requireRole([
  EUserRole.INSTRUCTOR,
  EUserRole.ADMIN,
]);
export const requireStudentOrInstructor = requireRole([
  EUserRole.STUDENT,
  EUserRole.INSTRUCTOR,
]);
