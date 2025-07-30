import { LessonModel } from "../models/Lesson";
import { CourseModel } from "../models/Course";
import {
  Lesson,
  CreateLessonInput,
  UpdateLessonInput,
  LessonQueryInput,
  LessonQueryResult,
} from "../interfaces/lesson.interface";
import { IPagination } from "../interfaces/pagination.interface";
import { DEFAULT_END_ROW, DEFAULT_START_ROW } from "../shared/constants";
import { filterToMongo } from "../utils/filterToMongo";
import { SortToMongo } from "../utils/sortToMongo";

export class LessonService {
  static async getLessons(query: LessonQueryInput): Promise<LessonQueryResult> {
    const { filterModel, sortModel } = query;

    const mongoFilter = filterToMongo(filterModel);
    const mongoSort = SortToMongo(sortModel ?? []);

    const startRow = query.startRow ?? DEFAULT_START_ROW;
    const endRow = query.endRow ?? DEFAULT_END_ROW;
    const skip = startRow;
    const limit = endRow - startRow;

    const result = await LessonModel.findAll(
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
    query: LessonQueryInput
  ): Promise<LessonQueryResult> {
    if (!courseId) {
      throw new Error("Course ID is required");
    }

    const { filterModel, sortModel } = query;
    const mongoFilter = filterToMongo(filterModel);
    const mongoSort = SortToMongo(sortModel ?? []);

    const startRow = query.startRow ?? DEFAULT_START_ROW;
    const endRow = query.endRow ?? DEFAULT_END_ROW;
    const skip = startRow;
    const limit = endRow - startRow;

    const result = await LessonModel.findByCourse(
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

  static async getPublishedLessonsByCourse(
    courseId: string,
    query: LessonQueryInput
  ): Promise<LessonQueryResult> {
    if (!courseId) {
      throw new Error("Course ID is required");
    }

    const { filterModel, sortModel } = query;
    const mongoFilter = filterToMongo(filterModel);
    const mongoSort = SortToMongo(sortModel ?? []);

    const startRow = query.startRow ?? DEFAULT_START_ROW;
    const endRow = query.endRow ?? DEFAULT_END_ROW;
    const skip = startRow;
    const limit = endRow - startRow;

    const result = await LessonModel.findByCourse(
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
}
