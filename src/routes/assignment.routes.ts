import { Router } from "express";
import {
  createAssignment,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  publishAssignment,
  submitAssignment,
  getStudentSubmission,
  getStudentSubmissions,
  getAssignmentSubmissions,
  gradeSubmission,
  autoGradeSubmission,
  getAssignmentsByLesson,
  getAssignmentsByCourse,
  getAssignmentsByInstructor,
  deleteSubmission,
} from "../controllers/assignment.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import {
  requireInstructor,
  requireStudent,
} from "../middlewares/roles.middleware";

const assignmentRouter = Router();

// Public routes
assignmentRouter.get("/:id", getAssignmentById);
assignmentRouter.get("/course/:courseId", getAssignmentsByCourse);
assignmentRouter.post("/lesson", getAssignmentsByLesson);
// Protected routes
assignmentRouter.use(authenticateToken);

// Instructor routes
assignmentRouter.post("/", requireInstructor, getAssignmentsByInstructor);
assignmentRouter.put("/:id", requireInstructor, updateAssignment);
assignmentRouter.delete("/:id", requireInstructor, deleteAssignment);
assignmentRouter.patch("/:id/publish", requireInstructor, publishAssignment);
assignmentRouter.get(
  "/:id/submissions",
  requireInstructor,
  getAssignmentSubmissions
);
assignmentRouter.put(
  "/submissions/:submissionId/grade",
  requireInstructor,
  gradeSubmission
);
assignmentRouter.put(
  "/submissions/:submissionId/auto-grade",
  requireInstructor,
  autoGradeSubmission
);
// Student routes
assignmentRouter.post("/:id/submit", requireStudent, submitAssignment);
assignmentRouter.get("/:id/submission", requireStudent, getStudentSubmission);
assignmentRouter.delete("/:id/submission", requireStudent, deleteSubmission);
assignmentRouter.get(
  "/student/my-submissions",
  requireStudent,
  getStudentSubmissions
);

export default assignmentRouter;
