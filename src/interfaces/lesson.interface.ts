import { Document, Types } from "mongoose";

export interface Lesson extends Document {
  courseId: Types.ObjectId;
  title: string;
  description: string;
  content: string;
  videoUrl?: string;
  order: number;
  duration: number; // in minutes
  isPublished: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateLessonInput {
  courseId: string;
  title: string;
  description: string;
  content: string;
  videoUrl?: string;
  order: number;
  duration: number;
}

export interface UpdateLessonInput {
  title?: string;
  description?: string;
  content?: string;
  videoUrl?: string;
  order?: number;
  duration?: number;
  isPublished?: boolean;
}
