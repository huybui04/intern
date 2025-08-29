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

import { filterToMongo } from "../utils/filterToMongo";
import { SortToMongo } from "../utils/sortToMongo";
import { DEFAULT_END_ROW, DEFAULT_START_ROW } from "../shared/constants";

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
      throw new Error("Assignment not found");
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

    // Tự động chấm điểm
    let totalScore = 0;
    const gradedAnswers = answers.map((answer) => {
      const question = assignment.questions.find(
        (q) => q._id?.toString() === answer.questionId
      );

      if (question) {
        let isCorrect = false;

        // Kiểm tra đáp án theo loại câu hỏi
        switch (question.type) {
          case "multiple_choice":
            isCorrect = answer.answer === question.correctAnswer;
            break;
          case "true_false":
            isCorrect = answer.answer === question.correctAnswer;
            break;
          case "essay":
            // Essay không thể tự động chấm, cần chấm thủ công
            isCorrect = false;
            break;
          default:
            isCorrect = false;
        }

        if (isCorrect) {
          totalScore += question.points;
        }
      }

      return answer;
    });

    // Tính điểm dựa trên tổng điểm có thể đạt được (chỉ tính các câu không phải essay)
    const autoGradableQuestions = assignment.questions.filter(
      (q) => q.type !== "essay"
    );
    const maxAutoScore = autoGradableQuestions.reduce(
      (sum, q) => sum + q.points,
      0
    );

    const submission = await AssignmentModel.submitAssignment(
      assignmentId,
      studentId,
      gradedAnswers
    );

    // Cập nhật điểm số cho submission
    if (submission) {
      submission.score = totalScore;
      submission.gradedAt = new Date();
      submission.status = "graded";
      await submission.save();
    }

    return submission;
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
    query: AssignmentQueryInput
  ): Promise<AssignmentQueryResult> {
    const { filterModel, sortModel } = query;

    const mongoFilter = filterToMongo(filterModel);
    const mongoSort = SortToMongo(sortModel ?? []);

    const startRow = query.startRow ?? DEFAULT_START_ROW;
    const endRow = query.endRow ?? DEFAULT_END_ROW;
    const skip = startRow;
    const limit = endRow - startRow;

    const result = await AssignmentModel.findByCourse(
      courseId,
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

  static async getPublishedAssignmentsByLesson(
    lessonId: string,
    query: AssignmentQueryInput
  ): Promise<AssignmentQueryResult> {
    const { filterModel, sortModel } = query;

    const mongoFilter = filterToMongo(filterModel);
    const mongoSort = SortToMongo(sortModel ?? []);

    const startRow = query.startRow ?? DEFAULT_START_ROW;
    const endRow = query.endRow ?? DEFAULT_END_ROW;
    const skip = startRow;
    const limit = endRow - startRow;

    const result = await AssignmentModel.findByLesson(
      lessonId,
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

  static async getAssignmentsByInstructor(
    instructorId: string
  ): Promise<Assignment[]> {
    // Lấy tất cả course mà instructor này sở hữu
    const courses = await CourseModel.findByInstructor(instructorId, 0, 1000);
    const courseIds = courses.data.map((c: any) => c._id.toString());

    // Lấy tất cả assignment thuộc các course này
    const assignments: Assignment[] = [];
    for (const courseId of courseIds) {
      const courseAssignments = await AssignmentModel.findByCourse(
        courseId,
        0,
        1000
      );
      assignments.push(...courseAssignments.data);
    }
    return assignments;
  }

  static async deleteSubmission(
    assignmentId: string,
    studentId: string
  ): Promise<boolean> {
    if (!assignmentId || !studentId) {
      throw new Error("Assignment ID and Student ID are required");
    }

    // Check if assignment exists
    const assignment = await AssignmentModel.findById(assignmentId);
    if (!assignment) {
      throw new Error("Assignment not found");
    }

    // Check if submission exists
    const submission = await AssignmentModel.findSubmission(
      assignmentId,
      studentId
    );
    if (!submission) {
      throw new Error("Submission not found");
    }

    return await AssignmentModel.deleteSubmission(assignmentId, studentId);
  }
}
