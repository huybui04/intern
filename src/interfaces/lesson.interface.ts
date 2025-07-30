import { Document, Types } from "mongoose";
import { IPagination } from "./pagination.interface";
import { IFilter } from "./filter.interface";
import { ISort } from "./sort.interface";

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

export interface LessonQueryInput extends IPagination {
  filterModel?: any;
  sortModel?: any[];
  startRow?: number;
  endRow?: number;
  courseId?: string;
}

export interface LessonQueryResult {
  rowData: Lesson[];
  rowCount: number;
}
