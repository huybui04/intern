import { CourseModel } from "../models/Course";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from "../shared/constants";
import { IFilter } from "../interfaces/filter.interface";
import { ISort } from "../interfaces/sort.interface";
import { IPagination } from "../interfaces/pagination.interface";
import { UserModel, UserMongooseModel } from "../models/User";
import {
  Course,
  CreateCourseInput,
  UpdateCourseInput,
  CourseEnrollment,
} from "../interfaces/course.interface";
import { UserRole } from "../interfaces/enum";
import { Types } from "mongoose";

// Chuẩn hóa input cho ag-Grid query
export interface CourseQueryInput extends IPagination {
  sort?: ISort[];
  filter?: IFilter[];
  search?: string;
  instructorId?: string;
}

export interface CourseQueryResult {
  data: Course[];
  total: number;
}

export class CourseService {
  // Lấy danh sách course chuẩn hóa cho ag-Grid (phân trang, sắp xếp, lọc, tìm kiếm)
  static async getCourses(query: CourseQueryInput): Promise<CourseQueryResult> {
    // Xây dựng filter
    const mongoFilter: any = {};
    if (query.instructorId) {
      mongoFilter.instructorId = query.instructorId;
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
    // Tìm kiếm toàn cục (title, description)
    if (query.search) {
      mongoFilter.$or = [
        { title: { $regex: query.search, $options: "i" } },
        { description: { $regex: query.search, $options: "i" } },
      ];
    }
    // Sắp xếp
    let sortObj: any = {};
    if (query.sort && query.sort.length > 0) {
      for (const s of query.sort) {
        sortObj[s.field] = s.direction === "asc" ? 1 : -1;
      }
    } else {
      sortObj = { createdAt: -1 };
    }
    // Phân trang
    const page = query.page ?? DEFAULT_PAGE;
    const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
    const skip = (page - 1) * pageSize;
    // Query
    const [data, total] = await Promise.all([
      CourseModel.findAll(mongoFilter, sortObj, skip, pageSize).then(
        (r) => r.data
      ),
      CourseModel.findAll(mongoFilter, sortObj, skip, pageSize).then(
        (r) => r.totalCount
      ),
    ]);
    return { data, total };
  }
  static async createCourse(
    courseData: CreateCourseInput,
    instructorId: string
  ): Promise<Course> {
    // Validate instructor exists and has correct role
    const instructor = await UserMongooseModel.findById(instructorId);
    if (!instructor || instructor.role !== UserRole.INSTRUCTOR) {
      throw new Error("Only instructors can create courses");
    }

    return await CourseModel.create({
      ...courseData,
      instructorId: new Types.ObjectId(instructorId),
      instructorName: instructor.username,
    });
  }

  static async getCourseById(id: string): Promise<Course | null> {
    if (!id) {
      throw new Error("Course ID is required");
    }
    return await CourseModel.findById(id);
  }

  static async getAllCourses(
    filters: IFilter[] = [],
    sorts: ISort[] = [],
    pagination: IPagination = {}
  ): Promise<{ data: Course[]; totalCount: number }> {
    const mongoFilter: any = {};
    for (const filter of filters) {
      switch (filter.operator) {
        case "eq":
          mongoFilter[filter.field] = filter.value;
          break;
        case "ne":
          mongoFilter[filter.field] = { $ne: filter.value };
          break;
        case "lt":
          mongoFilter[filter.field] = { $lt: filter.value };
          break;
        case "lte":
          mongoFilter[filter.field] = { $lte: filter.value };
          break;
        case "gt":
          mongoFilter[filter.field] = { $gt: filter.value };
          break;
        case "gte":
          mongoFilter[filter.field] = { $gte: filter.value };
          break;
        case "in":
          mongoFilter[filter.field] = { $in: filter.value };
          break;
        case "nin":
          mongoFilter[filter.field] = { $nin: filter.value };
          break;
        case "regex":
          mongoFilter[filter.field] = { $regex: filter.value, $options: "i" };
          break;
        default:
          break;
      }
    }

    const mongoSort: any = {};
    for (const sort of sorts) {
      mongoSort[sort.field] = sort.direction === "asc" ? 1 : -1;
    }

    const page = pagination.page ?? DEFAULT_PAGE;
    const pageSize = pagination.pageSize ?? DEFAULT_PAGE_SIZE;
    const skip = (page - 1) * pageSize;
    return await CourseModel.findAll(mongoFilter, mongoSort, skip, pageSize);
  }

  static async getInstructorCourses(instructorId: string): Promise<Course[]> {
    if (!instructorId) {
      throw new Error("Instructor ID is required");
    }
    return await CourseModel.findByInstructor(instructorId);
  }

  static async updateCourse(
    id: string,
    updates: UpdateCourseInput,
    userId: string
  ): Promise<Course | null> {
    if (!id) {
      throw new Error("Course ID is required");
    }

    const course = await CourseModel.findById(id);
    if (!course) {
      throw new Error("Course not found");
    }

    // Check if user is the instructor of this course
    if (course.instructorId.toString() !== userId) {
      throw new Error("Only the course instructor can update this course");
    }

    return await CourseModel.updateById(id, updates);
  }

  static async deleteCourse(id: string, userId: string): Promise<boolean> {
    if (!id) {
      throw new Error("Course ID is required");
    }

    const course = await CourseModel.findById(id);
    if (!course) {
      throw new Error("Course not found");
    }

    // Check if user is the instructor of this course
    if (course.instructorId.toString() !== userId) {
      throw new Error("Only the course instructor can delete this course");
    }

    return await CourseModel.deleteById(id);
  }

  static async enrollInCourse(
    courseId: string,
    studentId: string
  ): Promise<CourseEnrollment> {
    if (!courseId || !studentId) {
      throw new Error("Course ID and Student ID are required");
    }

    // Validate student exists and has correct role
    const student = await UserMongooseModel.findById(studentId);
    if (!student || student.role !== UserRole.STUDENT) {
      throw new Error("Only students can enroll in courses");
    }

    // Check if course exists and is published
    const course = await CourseModel.findById(courseId);
    if (!course) {
      throw new Error("Course not found");
    }
    if (!course.isPublished) {
      throw new Error("Course is not published");
    }

    // Check enrollment limit
    if (
      course.maxStudents &&
      course.enrolledStudents.length >= course.maxStudents
    ) {
      throw new Error("Course is full");
    }

    return await CourseModel.enrollStudent(courseId, studentId);
  }

  static async getStudentCourses(
    studentId: string
  ): Promise<CourseEnrollment[]> {
    if (!studentId) {
      throw new Error("Student ID is required");
    }
    return await CourseModel.getStudentCourses(studentId);
  }

  static async publishCourse(
    courseId: string,
    instructorId: string
  ): Promise<Course | null> {
    if (!courseId) {
      throw new Error("Course ID is required");
    }

    const course = await CourseModel.findById(courseId);
    if (!course) {
      throw new Error("Course not found");
    }

    if (course.instructorId.toString() !== instructorId) {
      throw new Error("Only the course instructor can publish this course");
    }

    return await CourseModel.updateById(courseId, { isPublished: true });
  }

  static async getCourseStats(
    courseId: string,
    instructorId: string
  ): Promise<{
    course: Course;
    enrollmentStats: { totalStudents: number; completedStudents: number };
  }> {
    const course = await CourseModel.findById(courseId);
    if (!course) {
      throw new Error("Course not found");
    }

    if (course.instructorId.toString() !== instructorId) {
      throw new Error("Only the course instructor can view these stats");
    }

    const enrollmentStats = await CourseModel.getEnrollmentStats(courseId);

    return {
      course,
      enrollmentStats,
    };
  }
}
