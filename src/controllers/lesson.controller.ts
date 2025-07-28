import { IPagination } from "../interfaces/pagination.interface";
import { Request, Response } from "express";
import { LessonService } from "../services/lesson.service";
import {
  CreateLessonInput,
  UpdateLessonInput,
} from "../interfaces/lesson.interface";
import { AuthRequest } from "../middlewares/auth.middleware";
import { DEFAULT_END_ROW, DEFAULT_START_ROW } from "../shared/constants";

export const createLesson = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const lessonData: CreateLessonInput = req.body;
    const instructorId = req.user!.userId;

    const lesson = await LessonService.createLesson(lessonData, instructorId);
    res.status(201).json({
      message: "Lesson created successfully",
      data: lesson,
    });
  } catch (error) {
    console.error("Create lesson error:", error);
    res.status(400).json({
      message:
        error instanceof Error ? error.message : "Lesson creation failed",
    });
  }
};

export const getLessonById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const lesson = await LessonService.getLessonById(id);

    if (!lesson) {
      res.status(404).json({ message: "Lesson not found" });
      return;
    }

    res.status(200).json({
      message: "Lesson retrieved successfully",
      data: lesson,
    });
  } catch (error) {
    console.error("Get lesson by ID error:", error);
    res.status(400).json({
      message: error instanceof Error ? error.message : "Bad request",
    });
  }
};

export const getLessonsByCourse = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { courseId } = req.params;
    const { published } = req.query;

    let page = DEFAULT_START_ROW;
    let pageSize = DEFAULT_END_ROW;
    if (req.query.page)
      page = parseInt(req.query.page as string) || DEFAULT_START_ROW;
    if (req.query.pageSize)
      pageSize = parseInt(req.query.pageSize as string) || DEFAULT_END_ROW;
    const startRow = (page - 1) * pageSize;
    const endRow = startRow + pageSize;
    const pagination: IPagination = { startRow, endRow };
    let lessons;
    if (published === "true") {
      lessons = await LessonService.getPublishedLessonsByCourse(
        courseId,
        pagination
      );
    } else {
      lessons = await LessonService.getLessonsByCourse(courseId, pagination);
    }
    res.status(200).json({
      message: "Lessons retrieved successfully",
      data: lessons,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("Get lessons by course error:", error);
    res.status(400).json({
      message: error instanceof Error ? error.message : "Bad request",
    });
  }
};

export const updateLesson = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const updates: UpdateLessonInput = req.body;
    const instructorId = req.user!.userId;

    const updatedLesson = await LessonService.updateLesson(
      id,
      updates,
      instructorId
    );

    if (!updatedLesson) {
      res.status(404).json({ message: "Lesson not found" });
      return;
    }

    res.status(200).json({
      message: "Lesson updated successfully",
      data: updatedLesson,
    });
  } catch (error) {
    console.error("Update lesson error:", error);
    res.status(400).json({
      message: error instanceof Error ? error.message : "Bad request",
    });
  }
};

export const deleteLesson = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const instructorId = req.user!.userId;

    const deleted = await LessonService.deleteLesson(id, instructorId);

    if (!deleted) {
      res.status(404).json({ message: "Lesson not found" });
      return;
    }

    res.status(200).json({
      message: "Lesson deleted successfully",
    });
  } catch (error) {
    console.error("Delete lesson error:", error);
    res.status(400).json({
      message: error instanceof Error ? error.message : "Bad request",
    });
  }
};

export const publishLesson = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const instructorId = req.user!.userId;

    const publishedLesson = await LessonService.publishLesson(id, instructorId);
    res.status(200).json({
      message: "Lesson published successfully",
      data: publishedLesson,
    });
  } catch (error) {
    console.error("Publish lesson error:", error);
    res.status(400).json({
      message:
        error instanceof Error ? error.message : "Failed to publish lesson",
    });
  }
};

export const reorderLessons = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { courseId } = req.params;
    const { lessonOrders } = req.body;
    const instructorId = req.user!.userId;

    await LessonService.reorderLessons(courseId, lessonOrders, instructorId);
    res.status(200).json({
      message: "Lessons reordered successfully",
    });
  } catch (error) {
    console.error("Reorder lessons error:", error);
    res.status(400).json({
      message:
        error instanceof Error ? error.message : "Failed to reorder lessons",
    });
  }
};
