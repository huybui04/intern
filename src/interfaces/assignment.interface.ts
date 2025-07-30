import { Document, Types } from "mongoose";
import { IPagination } from "./pagination.interface";

export interface Assignment extends Document {
  courseId: Types.ObjectId;
  lessonId?: Types.ObjectId;
  title: string;
  description: string;
  questions: AssignmentQuestion[];
  totalPoints: number;
  dueDate?: Date;
  isPublished: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AssignmentQuestion {
  _id?: Types.ObjectId;
  question: string;
  type: "multiple_choice" | "essay" | "true_false";
  options?: string[]; // for multiple choice
  correctAnswer?: string | number; // for multiple choice and true/false
  points: number;
}

export interface CreateAssignmentInput {
  courseId: string;
  lessonId?: string;
  title: string;
  description: string;
  questions: Omit<AssignmentQuestion, "_id">[];
  dueDate?: Date;
}

export interface UpdateAssignmentInput {
  title?: string;
  description?: string;
  questions?: Omit<AssignmentQuestion, "_id">[];
  dueDate?: Date;
  isPublished?: boolean;
}

export interface AssignmentSubmission extends Document {
  assignmentId: Types.ObjectId;
  studentId: Types.ObjectId;
  answers: SubmissionAnswer[];
  submittedAt: Date;
  score?: number;
  feedback?: string;
  gradedAt?: Date;
  gradedBy?: Types.ObjectId;
}

export interface SubmissionAnswer {
  questionId: Types.ObjectId;
  answer: string | number;
}

export interface GradeAssignmentInput {
  score: number;
  feedback?: string;
}

export interface AssignmentQueryInput extends IPagination {
  filterModel?: any;
  sortModel?: any[];
  startRow?: number;
  endRow?: number;
  courseId?: string;
  lessonId?: string;
}

export interface AssignmentQueryResult {
  rowData: Assignment[];
  rowCount: number;
}
