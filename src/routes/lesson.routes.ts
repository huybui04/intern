import { Router } from "express";
import {
  createLesson,
  getLessonById,
  getLessonsByCourse,
  updateLesson,
  deleteLesson,
  publishLesson,
  reorderLessons,
} from "../controllers/lesson.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import {
  requireInstructor,
  requireStudentOrInstructor,
} from "../middlewares/roles.middleware";

const lessonRouter = Router();

// Public routes
lessonRouter.get("/:id", getLessonById);
lessonRouter.get("/course/:courseId", getLessonsByCourse);

// Protected routes
lessonRouter.use(authenticateToken);

// Instructor routes
lessonRouter.post("/", requireInstructor, createLesson);
lessonRouter.put("/:id", requireInstructor, updateLesson);
lessonRouter.delete("/:id", requireInstructor, deleteLesson);
lessonRouter.patch("/:id/publish", requireInstructor, publishLesson);
lessonRouter.put(
  "/course/:courseId/reorder",
  requireInstructor,
  reorderLessons
);

export default lessonRouter;
