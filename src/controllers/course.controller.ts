import { Request, Response } from "express";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from "../shared/constants";
import { IPagination } from "../interfaces/pagination.interface";
import { CourseService } from "../services/course.service";
import {
  CreateCourseInput,
  UpdateCourseInput,
} from "../interfaces/course.interface";
import { AuthRequest } from "../middlewares/auth.middleware";
import { IFilter } from "../interfaces/filter.interface";
import { ISort } from "../interfaces/sort.interface";

export const createCourse = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const courseData: CreateCourseInput = req.body;
    const instructorId = req.user!.userId;

    const course = await CourseService.createCourse(courseData, instructorId);
    res.status(201).json({
      message: "Course created successfully",
      data: course,
    });
  } catch (error) {
    console.error("Create course error:", error);
    res.status(400).json({
      message:
        error instanceof Error ? error.message : "Course creation failed",
    });
  }
};

export const getAllCourses = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    let filters: IFilter[] = [];
    let sorts: ISort[] = [];
    let page = DEFAULT_PAGE;
    let pageSize = DEFAULT_PAGE_SIZE;

    if (req.query.filters) {
      try {
        filters = JSON.parse(req.query.filters as string);
      } catch (e) {
        res.status(400).json({ message: "Invalid filters format" });
        return;
      }
    }
    if (req.query.sorts) {
      try {
        sorts = JSON.parse(req.query.sorts as string);
      } catch (e) {
        res.status(400).json({ message: "Invalid sorts format" });
        return;
      }
    }
    if (req.query.page)
      page = parseInt(req.query.page as string) || DEFAULT_PAGE;
    if (req.query.pageSize)
      pageSize = parseInt(req.query.pageSize as string) || DEFAULT_PAGE_SIZE;

    const pagination: IPagination = { page, pageSize };
    const { data, totalCount } = await CourseService.getAllCourses(
      filters,
      sorts,
      pagination
    );
    res.status(200).json({
      message: "Courses retrieved successfully",
      data,
      totalCount,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("Get all courses error:", error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

export const getCourseById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const course = await CourseService.getCourseById(id);

    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    res.status(200).json({
      message: "Course retrieved successfully",
      data: course,
    });
  } catch (error) {
    console.error("Get course by ID error:", error);
    res.status(400).json({
      message: error instanceof Error ? error.message : "Bad request",
    });
  }
};

export const getInstructorCourses = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const instructorId = req.user!.userId;
    const courses = await CourseService.getInstructorCourses(instructorId);

    res.status(200).json({
      message: "Instructor courses retrieved successfully",
      data: courses,
    });
  } catch (error) {
    console.error("Get instructor courses error:", error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

export const updateCourse = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const updates: UpdateCourseInput = req.body;
    const userId = req.user!.userId;

    const updatedCourse = await CourseService.updateCourse(id, updates, userId);

    if (!updatedCourse) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    res.status(200).json({
      message: "Course updated successfully",
      data: updatedCourse,
    });
  } catch (error) {
    console.error("Update course error:", error);
    res.status(400).json({
      message: error instanceof Error ? error.message : "Bad request",
    });
  }
};

export const deleteCourse = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const deleted = await CourseService.deleteCourse(id, userId);

    if (!deleted) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    res.status(200).json({
      message: "Course deleted successfully",
    });
  } catch (error) {
    console.error("Delete course error:", error);
    res.status(400).json({
      message: error instanceof Error ? error.message : "Bad request",
    });
  }
};

export const enrollInCourse = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const studentId = req.user!.userId;

    const enrollment = await CourseService.enrollInCourse(id, studentId);
    res.status(201).json({
      message: "Successfully enrolled in course",
      data: enrollment,
    });
  } catch (error) {
    console.error("Enroll in course error:", error);
    res.status(400).json({
      message: error instanceof Error ? error.message : "Enrollment failed",
    });
  }
};

export const getStudentCourses = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const studentId = req.user!.userId;
    const courses = await CourseService.getStudentCourses(studentId);

    res.status(200).json({
      message: "Student courses retrieved successfully",
      data: courses,
    });
  } catch (error) {
    console.error("Get student courses error:", error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

export const publishCourse = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const instructorId = req.user!.userId;

    const publishedCourse = await CourseService.publishCourse(id, instructorId);
    res.status(200).json({
      message: "Course published successfully",
      data: publishedCourse,
    });
  } catch (error) {
    console.error("Publish course error:", error);
    res.status(400).json({
      message:
        error instanceof Error ? error.message : "Failed to publish course",
    });
  }
};

export const getCourseStats = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const instructorId = req.user!.userId;

    const stats = await CourseService.getCourseStats(id, instructorId);
    res.status(200).json({
      message: "Course stats retrieved successfully",
      data: stats,
    });
  } catch (error) {
    console.error("Get course stats error:", error);
    res.status(400).json({
      message:
        error instanceof Error ? error.message : "Failed to get course stats",
    });
  }
};
