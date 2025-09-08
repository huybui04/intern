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
  getRelatedCourses,
  getEnrollmentJobStatus,
  getQueueStats,
  cancelEnrollmentJob,
} from "../controllers/course.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import {
  requireInstructor,
  requireStudent,
  requireInstructorOrAdmin,
} from "../middlewares/roles.middleware";

const courseRouter = Router();

// Public routes
courseRouter.post("/", getAllCourses);
courseRouter.get("/:id", getCourseById);
courseRouter.get("/:id/related", getRelatedCourses);

// Protected routes
courseRouter.use(authenticateToken);

// Instructor routes
courseRouter.post("/create", requireInstructor, createCourse);
courseRouter.post(
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

// Queue management routes
courseRouter.get("/queue/stats", requireInstructorOrAdmin, getQueueStats);
courseRouter.get("/queue/job/:jobId", getEnrollmentJobStatus);
courseRouter.delete("/queue/job/:jobId", cancelEnrollmentJob);

export default courseRouter;
