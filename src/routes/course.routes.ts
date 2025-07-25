import { Router } from "express";
import {
  createCourse,
  getAllCourses,
  getCourseById,
  getInstructorCourses,
  updateCourse,
  deleteCourse,
  enrollInCourse,
  getStudentCourses,
  publishCourse,
  getCourseStats,
} from "../controllers/course.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import {
  requireInstructor,
  requireStudent,
  requireInstructorOrAdmin,
} from "../middlewares/roles.middleware";

const courseRouter = Router();

// Public routes
courseRouter.get("/", getAllCourses);
courseRouter.get("/:id", getCourseById);

// Protected routes
courseRouter.use(authenticateToken);

// Instructor routes
courseRouter.post("/", requireInstructor, createCourse);
courseRouter.get(
  "/instructor/my-courses",
  requireInstructor,
  getInstructorCourses
);
courseRouter.put("/:id", requireInstructor, updateCourse);
courseRouter.delete("/:id", requireInstructor, deleteCourse);
courseRouter.patch("/:id/publish", requireInstructor, publishCourse);
courseRouter.get("/:id/stats", requireInstructor, getCourseStats);

// Student routes
courseRouter.post("/:id/enroll", requireStudent, enrollInCourse);
courseRouter.get("/student/my-courses", requireStudent, getStudentCourses);

export default courseRouter;
