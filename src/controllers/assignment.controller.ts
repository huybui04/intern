import { Request, Response } from "express";
import { AssignmentService } from "../services/assignment.service";
import {
  CreateAssignmentInput,
  UpdateAssignmentInput,
  GradeAssignmentInput,
} from "../interfaces/assignment.interface";
import { AuthRequest } from "../middlewares/auth.middleware";

export const createAssignment = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const assignmentData: CreateAssignmentInput = req.body;
    const instructorId = req.user!.userId;

    const assignment = await AssignmentService.createAssignment(
      assignmentData,
      instructorId
    );
    res.status(201).json({
      message: "Assignment created successfully",
      data: assignment,
    });
  } catch (error) {
    console.error("Create assignment error:", error);
    res.status(400).json({
      message:
        error instanceof Error ? error.message : "Assignment creation failed",
    });
  }
};

export const getAssignmentById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const assignment = await AssignmentService.getAssignmentById(id);

    if (!assignment) {
      res.status(404).json({ message: "Assignment not found" });
      return;
    }

    res.status(200).json({
      message: "Assignment retrieved successfully",
      data: assignment,
    });
  } catch (error) {
    console.error("Get assignment by ID error:", error);
    res.status(400).json({
      message: error instanceof Error ? error.message : "Bad request",
    });
  }
};

export const getAssignmentsByCourse = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { courseId } = req.params;
    const { published } = req.query;

    let assignments;
    if (published === "true") {
      assignments = await AssignmentService.getPublishedAssignmentsByCourse(
        courseId
      );
    } else {
      assignments = await AssignmentService.getAssignmentsByCourse(courseId);
    }

    res.status(200).json({
      message: "Assignments retrieved successfully",
      data: assignments,
    });
  } catch (error) {
    console.error("Get assignments by course error:", error);
    res.status(400).json({
      message: error instanceof Error ? error.message : "Bad request",
    });
  }
};

export const updateAssignment = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const updates: UpdateAssignmentInput = req.body;
    const instructorId = req.user!.userId;

    const updatedAssignment = await AssignmentService.updateAssignment(
      id,
      updates,
      instructorId
    );

    if (!updatedAssignment) {
      res.status(404).json({ message: "Assignment not found" });
      return;
    }

    res.status(200).json({
      message: "Assignment updated successfully",
      data: updatedAssignment,
    });
  } catch (error) {
    console.error("Update assignment error:", error);
    res.status(400).json({
      message: error instanceof Error ? error.message : "Bad request",
    });
  }
};

export const deleteAssignment = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const instructorId = req.user!.userId;

    const deleted = await AssignmentService.deleteAssignment(id, instructorId);

    if (!deleted) {
      res.status(404).json({ message: "Assignment not found" });
      return;
    }

    res.status(200).json({
      message: "Assignment deleted successfully",
    });
  } catch (error) {
    console.error("Delete assignment error:", error);
    res.status(400).json({
      message: error instanceof Error ? error.message : "Bad request",
    });
  }
};

export const publishAssignment = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const instructorId = req.user!.userId;

    const publishedAssignment = await AssignmentService.publishAssignment(
      id,
      instructorId
    );
    res.status(200).json({
      message: "Assignment published successfully",
      data: publishedAssignment,
    });
  } catch (error) {
    console.error("Publish assignment error:", error);
    res.status(400).json({
      message:
        error instanceof Error ? error.message : "Failed to publish assignment",
    });
  }
};

// Student submission endpoints
export const submitAssignment = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { answers } = req.body;
    const studentId = req.user!.userId;

    const submission = await AssignmentService.submitAssignment(
      id,
      studentId,
      answers
    );
    res.status(201).json({
      message: "Assignment submitted successfully",
      data: submission,
    });
  } catch (error) {
    console.error("Submit assignment error:", error);
    res.status(400).json({
      message: error instanceof Error ? error.message : "Submission failed",
    });
  }
};

export const getStudentSubmission = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const studentId = req.user!.userId;

    const submission = await AssignmentService.getStudentSubmission(
      id,
      studentId
    );
    res.status(200).json({
      message: "Submission retrieved successfully",
      data: submission,
    });
  } catch (error) {
    console.error("Get student submission error:", error);
    res.status(400).json({
      message: error instanceof Error ? error.message : "Bad request",
    });
  }
};

export const getStudentSubmissions = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const studentId = req.user!.userId;
    const submissions = await AssignmentService.getStudentSubmissions(
      studentId
    );

    res.status(200).json({
      message: "Student submissions retrieved successfully",
      data: submissions,
    });
  } catch (error) {
    console.error("Get student submissions error:", error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

// Instructor grading endpoints
export const getAssignmentSubmissions = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const instructorId = req.user!.userId;

    const submissions = await AssignmentService.getAssignmentSubmissions(
      id,
      instructorId
    );
    res.status(200).json({
      message: "Assignment submissions retrieved successfully",
      data: submissions,
    });
  } catch (error) {
    console.error("Get assignment submissions error:", error);
    res.status(400).json({
      message: error instanceof Error ? error.message : "Bad request",
    });
  }
};

export const gradeSubmission = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { submissionId } = req.params;
    const gradeData: GradeAssignmentInput = req.body;
    const instructorId = req.user!.userId;

    const gradedSubmission = await AssignmentService.gradeSubmission(
      submissionId,
      gradeData,
      instructorId
    );
    res.status(200).json({
      message: "Submission graded successfully",
      data: gradedSubmission,
    });
  } catch (error) {
    console.error("Grade submission error:", error);
    res.status(400).json({
      message: error instanceof Error ? error.message : "Grading failed",
    });
  }
};

export const autoGradeSubmission = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { submissionId } = req.params;
    const instructorId = req.user!.userId;

    const gradedSubmission = await AssignmentService.autoGradeSubmission(
      submissionId,
      instructorId
    );
    res.status(200).json({
      message: "Submission auto-graded successfully",
      data: gradedSubmission,
    });
  } catch (error) {
    console.error("Auto-grade submission error:", error);
    res.status(400).json({
      message: error instanceof Error ? error.message : "Auto-grading failed",
    });
  }
};
