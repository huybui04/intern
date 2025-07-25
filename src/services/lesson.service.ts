import { LessonModel } from "../models/Lesson";
import { CourseModel } from "../models/Course";
import {
  Lesson,
  CreateLessonInput,
  UpdateLessonInput,
} from "../interfaces/lesson.interface";

import { IFilter } from "../interfaces/filter.interface";
import { ISort } from "../interfaces/sort.interface";
import { IPagination } from "../interfaces/pagination.interface";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from "../shared/constants";

export interface LessonQueryInput extends IPagination {
  sort?: ISort[];
  filter?: IFilter[];
  search?: string;
  courseId?: string;
}

export interface LessonQueryResult {
  data: Lesson[];
  total: number;
}

export class LessonService {
  static async getLessons(query: LessonQueryInput): Promise<LessonQueryResult> {
    const mongoFilter: any = {};
    if (query.courseId) {
      mongoFilter.courseId = query.courseId;
    }
    if (query.filter && query.filter.length > 0) {
      for (const f of query.filter) {
        switch (f.operator) {
          case "eq":
            mongoFilter[f.field] = f.value;
            break;
          case "ne":
            mongoFilter[f.field] = { $ne: f.value };
            break;
          case "lt":
            mongoFilter[f.field] = { $lt: f.value };
            break;
          case "lte":
            mongoFilter[f.field] = { $lte: f.value };
            break;
          case "gt":
            mongoFilter[f.field] = { $gt: f.value };
            break;
          case "gte":
            mongoFilter[f.field] = { $gte: f.value };
            break;
          case "in":
            mongoFilter[f.field] = { $in: f.value };
            break;
          case "nin":
            mongoFilter[f.field] = { $nin: f.value };
            break;
          case "regex":
            mongoFilter[f.field] = { $regex: f.value, $options: "i" };
            break;
        }
      }
    }
    if (query.search) {
      mongoFilter.$or = [
        { title: { $regex: query.search, $options: "i" } },
        { description: { $regex: query.search, $options: "i" } },
        { content: { $regex: query.search, $options: "i" } },
      ];
    }
    let sortObj: any = {};
    if (query.sort && query.sort.length > 0) {
      for (const s of query.sort) {
        sortObj[s.field] = s.direction === "asc" ? 1 : -1;
      }
    } else {
      sortObj = { order: 1 };
    }
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;
    const [data, total] = await Promise.all([
      LessonModel.findWithQuery(mongoFilter, sortObj, skip, pageSize),
      LessonModel.countWithQuery(mongoFilter),
    ]);
    return { data, total };
  }
  static async createLesson(
    lessonData: CreateLessonInput,
    instructorId: string
  ): Promise<Lesson> {
    const course = await CourseModel.findById(lessonData.courseId);
    if (!course) {
      throw new Error("Course not found");
    }

    if (course.instructorId.toString() !== instructorId) {
      throw new Error("Only the course instructor can create lessons");
    }

    return await LessonModel.create(lessonData);
  }

  static async getLessonById(id: string): Promise<Lesson | null> {
    if (!id) {
      throw new Error("Lesson ID is required");
    }
    return await LessonModel.findById(id);
  }

  static async updateLesson(
    id: string,
    updates: UpdateLessonInput,
    instructorId: string
  ): Promise<Lesson | null> {
    if (!id) {
      throw new Error("Lesson ID is required");
    }

    const lesson = await LessonModel.findById(id);
    if (!lesson) {
      throw new Error("Lesson not found");
    }

    const course = await CourseModel.findById(lesson.courseId.toString());
    if (!course || course.instructorId.toString() !== instructorId) {
      throw new Error("Only the course instructor can update this lesson");
    }

    return await LessonModel.updateById(id, updates);
  }

  static async deleteLesson(
    id: string,
    instructorId: string
  ): Promise<boolean> {
    if (!id) {
      throw new Error("Lesson ID is required");
    }

    const lesson = await LessonModel.findById(id);
    if (!lesson) {
      throw new Error("Lesson not found");
    }

    const course = await CourseModel.findById(lesson.courseId.toString());
    if (!course || course.instructorId.toString() !== instructorId) {
      throw new Error("Only the course instructor can delete this lesson");
    }

    return await LessonModel.deleteById(id);
  }

  static async publishLesson(
    id: string,
    instructorId: string
  ): Promise<Lesson | null> {
    return await this.updateLesson(id, { isPublished: true }, instructorId);
  }

  static async reorderLessons(
    courseId: string,
    lessonOrders: { lessonId: string; order: number }[],
    instructorId: string
  ): Promise<void> {
    const course = await CourseModel.findById(courseId);
    if (!course) {
      throw new Error("Course not found");
    }

    if (course.instructorId.toString() !== instructorId) {
      throw new Error("Only the course instructor can reorder lessons");
    }

    await LessonModel.reorderLessons(courseId, lessonOrders);
  }

  static async getLessonsByCourse(
    courseId: string,
    pagination: IPagination
  ): Promise<Lesson[]> {
    if (!courseId) {
      throw new Error("Course ID is required");
    }
    const page = pagination.page ?? DEFAULT_PAGE;
    const pageSize = pagination.pageSize ?? DEFAULT_PAGE_SIZE;
    const skip = (page - 1) * pageSize;

    const result = await LessonModel.findByCourse(courseId, skip, pageSize);
    return result.data;
  }

  static async getPublishedLessonsByCourse(
    courseId: string,
    pagination: IPagination
  ): Promise<Lesson[]> {
    const page = pagination.page ?? DEFAULT_PAGE;
    const pageSize = pagination.pageSize ?? DEFAULT_PAGE_SIZE;
    const skip = (page - 1) * pageSize;
    const lessons = await LessonModel.findByCourse(courseId, skip, pageSize);
    return lessons.data.filter((lesson) => lesson.isPublished);
  }
}
