import { Document, Types } from "mongoose";

export interface Course extends Document {
  title: string;
  description: string;
  instructorId: Types.ObjectId;
  instructorName: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  duration: number; // in hours
  price: number;
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
  maxStudents?: number;
}

export interface UpdateCourseInput {
  title?: string;
  description?: string;
  category?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  duration?: number;
  price?: number;
  maxStudents?: number;
  isPublished?: boolean;
}

export interface CourseEnrollment extends Document {
  courseId: Types.ObjectId;
  studentId: Types.ObjectId;
  enrolledAt: Date;
  completedLessons: Types.ObjectId[];
  progress: number; // percentage
  completedAt?: Date;
}
