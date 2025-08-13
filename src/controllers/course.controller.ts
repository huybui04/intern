import { Request, Response } from "express";
import { CourseService } from "../services/course.service";
import { QueueService } from "../services/queue.service";
import {
  CreateCourseInput,
  UpdateCourseInput,
} from "../interfaces/course.interface";
import { AuthRequest } from "../middlewares/auth.middleware";
import { getPageInfo } from "../utils/getPageInfo";
import { JobPriority } from "../interfaces/queue.interface";

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
    const { filterModel, sortModel, startRow, endRow } = req.body;

    const { rowData, rowCount } = await CourseService.getAllCourses({
      filterModel,
      sortModel,
      startRow,
      endRow,
    });

    const { pageSize, currentPage, totalPages } = getPageInfo(
      startRow,
      endRow,
      rowCount
    );

    res.status(200).json({
      success: true,
      errors: null,
      message: "Course retrieved successfully",
      data: {
        rows: rowData,
      },
      rowCount: rowCount,
      lastRow: rowCount,
      pageInfo: {
        startRow,
        endRow,
        pageSize,
        currentPage,
        totalPages,
      },
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
    const { filterModel, sortModel, startRow, endRow } = req.body;

    const { rowData, rowCount } = await CourseService.getInstructorCourses(
      instructorId,
      {
        filterModel,
        sortModel,
        startRow,
        endRow,
      }
    );

    const { pageSize, currentPage, totalPages } = getPageInfo(
      startRow,
      endRow,
      rowCount
    );

    res.status(200).json({
      success: true,
      errors: null,
      message: "Course retrieved successfully",
      data: {
        rows: rowData,
      },
      rowCount: rowCount,
      lastRow: rowCount,
      pageInfo: {
        startRow,
        endRow,
        pageSize,
        currentPage,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Get instructor courses error:", error);
    res.status(500).json({
      success: false,
      errors: error instanceof Error ? error.message : "Internal server error",
      rows: [],
      lastRow: 0,
      pageInfo: null,
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
    const { priority = JobPriority.NORMAL } = req.body;

    const result = await CourseService.enrollInCourse(id, studentId, priority);
    res.status(202).json({
      message: result.message,
      data: {
        jobId: result.jobId,
        status: "queued",
      },
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
    const { filterModel, sortModel, startRow, endRow } = req.body;

    const { rowData, rowCount } = await CourseService.getStudentCourses(
      {
        filterModel,
        sortModel,
        startRow,
        endRow,
      },
      studentId
    );

    const { pageSize, currentPage, totalPages } = getPageInfo(
      startRow,
      endRow,
      rowCount
    );

    res.status(200).json({
      success: true,
      errors: null,
      message: "Course retrieved successfully",

      data: {
        rows: rowData,
      },
      rowCount: rowCount,
      lastRow: rowCount,
      pageInfo: {
        startRow,
        endRow,
        pageSize,
        currentPage,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Get student courses error:", error);
    res.status(500).json({
      success: false,
      errors: error instanceof Error ? error.message : "Internal server error",
      rows: [],
      lastRow: 0,
      pageInfo: null,
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

export const getRelatedCourses = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { filterModel, sortModel, startRow, endRow } = req.body;

    const { rowData, rowCount } = await CourseService.getRelatedCourses(id, {
      filterModel,
      sortModel,
      startRow,
      endRow,
    });

    const { pageSize, currentPage, totalPages } = getPageInfo(
      startRow,
      endRow,
      rowCount
    );

    res.status(200).json({
      success: true,
      errors: null,
      message: "Related courses retrieved successfully",
      data: {
        rows: rowData,
      },
      rowCount: rowCount,
      lastRow: rowCount,
      pageInfo: {
        startRow,
        endRow,
        pageSize,
        currentPage,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Get related courses error:", error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

// Queue management endpoints
export const getEnrollmentJobStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { jobId } = req.params;

    const status = await QueueService.getJobStatus(jobId);
    if (!status) {
      res.status(404).json({ message: "Job not found" });
      return;
    }

    res.status(200).json({
      message: "Job status retrieved successfully",
      data: status,
    });
  } catch (error) {
    console.error("Get job status error:", error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

export const getQueueStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const stats = await QueueService.getQueueStats();
    res.status(200).json({
      message: "Queue statistics retrieved successfully",
      data: stats,
    });
  } catch (error) {
    console.error("Get queue stats error:", error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

export const cancelEnrollmentJob = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { jobId } = req.params;

    const cancelled = await QueueService.cancelJob(jobId);
    if (!cancelled) {
      res.status(404).json({ message: "Job not found or cannot be cancelled" });
      return;
    }

    res.status(200).json({
      message: "Job cancelled successfully",
    });
  } catch (error) {
    console.error("Cancel job error:", error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};
