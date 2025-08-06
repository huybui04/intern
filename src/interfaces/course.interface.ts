import { Document, Types } from "mongoose";
import { IPagination } from "./pagination.interface";

export interface Course extends Document {
  title: string;
  description: string;
  instructorId: Types.ObjectId;
  instructorName: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  duration: number; // in hours
  price: number;
  thumbnailUrl?: string;
  introVideoUrl?: string;
  tags?: string[];
  enrolledStudents: Types.ObjectId[];
  maxStudents?: number;
  isPublished: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateCourseInput {
  title: string;
  description: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  duration: number;
  price: number;
  thumbnailUrl?: string;
  introVideoUrl?: string;
  tags?: string[];
  maxStudents?: number;
}

export interface UpdateCourseInput {
  title?: string;
  description?: string;
  category?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  duration?: number;
  price?: number;
  thumbnailUrl?: string;
  introVideoUrl?: string;
  tags?: string[];
  maxStudents?: number;
  isPublished?: boolean;
}

// Chuẩn hóa input cho ag-Grid query
export interface CourseQueryInput extends IPagination {
  filterModel?: any;
  sortModel?: any[];
  startRow?: number;
  endRow?: number;
  instructorId?: string;
}

export interface CourseQueryResult {
  rowData: Course[];
  rowCount: number;
}

export interface CourseEnrollment extends Document {
  courseId: Types.ObjectId;
  studentId: Types.ObjectId;
  enrolledAt: Date;
  completedLessons: Types.ObjectId[];
  progress: number; // percentage
  completedAt?: Date;
}
