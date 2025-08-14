import { CourseModel } from "../models/Course";
import { UserMongooseModel } from "../models/User";
import {
  Course,
  CreateCourseInput,
  UpdateCourseInput,
  CourseEnrollment,
  CourseQueryInput,
  CourseQueryResult,
} from "../interfaces/course.interface";
import { EUserRole } from "../interfaces/enum";
import { Types } from "mongoose";
import {
  DEFAULT_END_ROW,
  DEFAULT_RELATED_COURSES_END_ROW,
  DEFAULT_START_ROW,
} from "../shared/constants";
import { filterToMongo } from "../utils/filterToMongo";
import { SortToMongo } from "../utils/sortToMongo";
import { QueueService } from "./queue.service";
import { JobPriority } from "../interfaces/queue.interface";

export class CourseService {
  static async createCourse(
    courseData: CreateCourseInput,
    instructorId: string
  ): Promise<Course> {
    // Validate instructor exists and has correct role
    const instructor = await UserMongooseModel.findById(instructorId);
    if (!instructor || instructor.role !== EUserRole.INSTRUCTOR) {
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
    query: CourseQueryInput
  ): Promise<CourseQueryResult> {
    const { filterModel, sortModel } = query;

    const mongoFilter = filterToMongo(filterModel);
    const mongoSort = SortToMongo(sortModel ?? []);

    const startRow = query.startRow ?? DEFAULT_START_ROW;
    const endRow = query.endRow ?? DEFAULT_END_ROW;
    const skip = startRow;
    const limit = endRow - startRow;

    const result = await CourseModel.findAll(
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

  static async getInstructorCourses(
    instructorId: string,
    query: CourseQueryInput
  ): Promise<CourseQueryResult> {
    if (!instructorId) {
      throw new Error("Instructor ID is required");
    }

    const { filterModel, sortModel } = query;
    const mongoFilter = filterToMongo(filterModel);
    const mongoSort = SortToMongo(sortModel ?? []);

    const startRow = query.startRow ?? DEFAULT_START_ROW;
    const endRow = query.endRow ?? DEFAULT_END_ROW;
    const skip = startRow;
    const limit = endRow - startRow;

    const result = await CourseModel.findByInstructor(
      instructorId,
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
    studentId: string,
    priority: JobPriority = JobPriority.NORMAL
  ): Promise<{ jobId: string; message: string }> {
    if (!courseId || !studentId) {
      throw new Error("Course ID and Student ID are required");
    }

    // Basic validation before queuing
    const student = await UserMongooseModel.findById(studentId);
    if (!student || student.role !== EUserRole.STUDENT) {
      throw new Error("Only students can enroll in courses");
    }

    const course = await CourseModel.findById(courseId);
    if (!course) {
      throw new Error("Course not found");
    }
    if (!course.isPublished) {
      throw new Error("Course is not published");
    }

    // Check if student is already enrolled
    const isAlreadyEnrolled = course.enrolledStudents.some(
      (enrollment: any) =>
        enrollment.studentId && enrollment.studentId.toString() === studentId
    );

    if (isAlreadyEnrolled) {
      throw new Error("Student is already enrolled in this course");
    }

    // Add enrollment job to queue
    const jobId = await QueueService.addEnrollmentJob(
      courseId,
      studentId,
      priority
    );

    return {
      jobId,
      message: "Enrollment request has been queued for processing",
    };
  }

  // Legacy method for direct enrollment (for backward compatibility)
  static async enrollInCourseDirectly(
    courseId: string,
    studentId: string
  ): Promise<CourseEnrollment> {
    if (!courseId || !studentId) {
      throw new Error("Course ID and Student ID are required");
    }

    // Validate student exists and has correct role
    const student = await UserMongooseModel.findById(studentId);
    if (!student || student.role !== EUserRole.STUDENT) {
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
    query: CourseQueryInput,
    studentId: string
  ): Promise<CourseQueryResult> {
    if (!studentId) {
      throw new Error("Student ID is required");
    }
    const { filterModel, sortModel } = query;

    const mongoFilter = filterToMongo(filterModel);
    const mongoSort = SortToMongo(sortModel ?? []);

    const startRow = query.startRow ?? DEFAULT_START_ROW;
    const endRow = query.endRow ?? DEFAULT_END_ROW;
    const skip = startRow;
    const limit = endRow - startRow;

    const result = await CourseModel.findByStudent(
      studentId,
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

  static async getRelatedCourses(
    courseId: string,
    query: CourseQueryInput
  ): Promise<CourseQueryResult> {
    if (!courseId) {
      throw new Error("Course ID is required");
    }

    const startRow = query.startRow ?? DEFAULT_START_ROW;
    const endRow = query.endRow ?? DEFAULT_RELATED_COURSES_END_ROW;
    const skip = startRow;
    const limit = endRow - startRow;

    const result = await CourseModel.findRelatedCourses(courseId, skip, limit);
    return {
      rowData: result.data,
      rowCount: result.totalCount,
    };
  }
}
