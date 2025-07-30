import { AssignmentModel } from "../models/Assignment";
import { CourseModel } from "../models/Course";
import {
  Assignment,
  CreateAssignmentInput,
  UpdateAssignmentInput,
  AssignmentSubmission,
  GradeAssignmentInput,
  AssignmentQueryInput,
  AssignmentQueryResult,
} from "../interfaces/assignment.interface";

import { IPagination } from "../interfaces/pagination.interface";
import { filterToMongo } from "@/utils/filterToMongo";
import { SortToMongo } from "@/utils/sortToMongo";
import { DEFAULT_END_ROW, DEFAULT_START_ROW } from "@/shared/constants";

export class AssignmentService {
  static async getAssignments(
    query: AssignmentQueryInput
  ): Promise<AssignmentQueryResult> {
    const { filterModel, sortModel } = query;

    const mongoFilter = filterToMongo(filterModel);
    const mongoSort = SortToMongo(sortModel ?? []);

    const startRow = query.startRow ?? DEFAULT_START_ROW;
    const endRow = query.endRow ?? DEFAULT_END_ROW;
    const skip = startRow;
    const limit = endRow - startRow;

    const result = await AssignmentModel.findAll(
      skip,
      limit,
      mongoFilter,
      mongoSort
    );
    return {
      rowData: result.data,
      rowCount: result.totalCount,
    };
  }
  static async createAssignment(
    assignmentData: CreateAssignmentInput,
    instructorId: string
  ): Promise<Assignment> {
    // Validate course exists and instructor owns it
    const course = await CourseModel.findById(assignmentData.courseId);
    if (!course) {
      throw new Error("Course not found");
    }

    if (course.instructorId.toString() !== instructorId) {
      throw new Error("Only the course instructor can create assignments");
    }

    return await AssignmentModel.createAssignment(assignmentData);
  }

  static async getAssignmentById(id: string): Promise<Assignment | null> {
    if (!id) {
      throw new Error("Assignment ID is required");
    }
    return await AssignmentModel.findById(id);
  }

  static async getAssignmentsByCourse(courseId: string): Promise<Assignment[]> {
    if (!courseId) {
      throw new Error("Course ID is required");
    }

    const result = await AssignmentModel.findByCourse(courseId, 0, 20);
    return result.data;
  }

  static async updateAssignment(
    id: string,
    updates: UpdateAssignmentInput,
    instructorId: string
  ): Promise<Assignment | null> {
    if (!id) {
      throw new Error("Assignment ID is required");
    }

    const assignment = await AssignmentModel.findById(id);
    if (!assignment) {
      throw new Error("Assignment not found");
    }

    // Check if instructor owns the course
    const course = await CourseModel.findById(assignment.courseId.toString());
    if (!course || course.instructorId.toString() !== instructorId) {
      throw new Error("Only the course instructor can update this assignment");
    }

    return await AssignmentModel.updateById(id, updates);
  }

  static async deleteAssignment(
    id: string,
    instructorId: string
  ): Promise<boolean> {
    if (!id) {
      throw new Error("Assignment ID is required");
    }

    const assignment = await AssignmentModel.findById(id);
    if (!assignment) {
      throw new Error("Assignment not found");
    }

    // Check if instructor owns the course
    const course = await CourseModel.findById(assignment.courseId.toString());
    if (!course || course.instructorId.toString() !== instructorId) {
      throw new Error("Only the course instructor can delete this assignment");
    }

    return await AssignmentModel.deleteById(id);
  }

  static async publishAssignment(
    id: string,
    instructorId: string
  ): Promise<Assignment | null> {
    return await this.updateAssignment(id, { isPublished: true }, instructorId);
  }

  // Student submission methods
  static async submitAssignment(
    assignmentId: string,
    studentId: string,
    answers: any[]
  ): Promise<AssignmentSubmission> {
    if (!assignmentId || !studentId) {
      throw new Error("Assignment ID and Student ID are required");
    }

    const assignment = await AssignmentModel.findById(assignmentId);
    if (!assignment) {
      throw new Error("Assignment not found");
    }

    if (!assignment.isPublished) {
      throw new Error("Assignment is not published");
    }

    // Check if due date has passed
    if (assignment.dueDate && new Date() > assignment.dueDate) {
      throw new Error("Assignment due date has passed");
    }

    return await AssignmentModel.submitAssignment(
      assignmentId,
      studentId,
      answers
    );
  }

  static async getStudentSubmission(
    assignmentId: string,
    studentId: string
  ): Promise<AssignmentSubmission | null> {
    return await AssignmentModel.findSubmission(assignmentId, studentId);
  }

  static async getStudentSubmissions(
    studentId: string
  ): Promise<AssignmentSubmission[]> {
    return await AssignmentModel.getStudentSubmissions(studentId);
  }

  // Instructor grading methods
  static async getAssignmentSubmissions(
    assignmentId: string,
    instructorId: string
  ): Promise<AssignmentSubmission[]> {
    const assignment = await AssignmentModel.findById(assignmentId);
    if (!assignment) {
      throw new Error("Assignment not found");
    }

    // Check if instructor owns the course
    const course = await CourseModel.findById(assignment.courseId.toString());
    if (!course || course.instructorId.toString() !== instructorId) {
      throw new Error("Only the course instructor can view submissions");
    }

    return await AssignmentModel.getSubmissionsByAssignment(assignmentId);
  }

  static async gradeSubmission(
    submissionId: string,
    gradeData: GradeAssignmentInput,
    instructorId: string
  ): Promise<AssignmentSubmission | null> {
    if (!submissionId) {
      throw new Error("Submission ID is required");
    }

    // Get submission to find assignment
    const submissions = await AssignmentModel.getSubmissionsByAssignment("");
    const submission = submissions.find(
      (s) => s._id?.toString() === submissionId
    );
    if (!submission) {
      throw new Error("Submission not found");
    }

    // Get assignment to validate instructor
    const assignment = await AssignmentModel.findById(
      submission.assignmentId.toString()
    );
    if (!assignment) {
      throw new Error("Assignment not found");
    }

    // Check if instructor owns the course
    const course = await CourseModel.findById(assignment.courseId.toString());
    if (!course || course.instructorId.toString() !== instructorId) {
      throw new Error("Only the course instructor can grade this submission");
    }

    // Validate score
    if (gradeData.score < 0 || gradeData.score > assignment.totalPoints) {
      throw new Error(`Score must be between 0 and ${assignment.totalPoints}`);
    }

    return await AssignmentModel.gradeSubmission(
      submissionId,
      gradeData,
      instructorId
    );
  }

  static async getPublishedAssignmentsByCourse(
    courseId: string,
    pagination: IPagination = {}
  ): Promise<Assignment[]> {
    const startRow = pagination.startRow ?? 0;
    const endRow = pagination.endRow ?? 20;
    const skip = startRow;
    const assignmentsResult = await AssignmentModel.findByCourse(
      courseId,
      skip,
      endRow
    );
    return assignmentsResult.data.filter(
      (assignment) => assignment.isPublished
    );
  }

  static async autoGradeSubmission(
    submissionId: string,
    instructorId: string
  ): Promise<AssignmentSubmission | null> {
    // Get submission
    const submissions = await AssignmentModel.getSubmissionsByAssignment("");
    const submission = submissions.find(
      (s) => s._id?.toString() === submissionId
    );
    if (!submission) {
      throw new Error("Submission not found");
    }

    // Get assignment
    const assignment = await AssignmentModel.findById(
      submission.assignmentId.toString()
    );
    if (!assignment) {
      throw new Error("Assignment not found");
    }

    // Calculate score based on correct answers
    let score = 0;
    for (const answer of submission.answers) {
      const question = assignment.questions.find(
        (q) => q._id?.toString() === answer.questionId.toString()
      );
      if (question && question.correctAnswer !== undefined) {
        if (
          question.type === "multiple_choice" ||
          question.type === "true_false"
        ) {
          if (answer.answer === question.correctAnswer) {
            score += question.points;
          }
        }
      }
    }

    return await this.gradeSubmission(
      submissionId,
      { score, feedback: "Auto-graded" },
      instructorId
    );
  }
}
