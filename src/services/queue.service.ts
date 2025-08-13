import { Job } from "bull";
import { courseEnrollmentQueue } from "./queue.config";
import { CourseModel } from "../models/Course";
import { UserMongooseModel } from "../models/User";
import {
  CourseEnrollmentJobData,
  EnrollmentResult,
  JobPriority,
  QueueJobStatus,
} from "../interfaces/queue.interface";
import { UserRole } from "../interfaces/enum";
import { CourseEnrollment } from "../interfaces/course.interface";

// Import the actual mongoose model
import { CourseMongooseModel } from "../models/Course";

export class QueueService {
  /**
   * Add course enrollment job to queue
   */
  static async addEnrollmentJob(
    courseId: string,
    studentId: string,
    priority: JobPriority = JobPriority.NORMAL
  ): Promise<string> {
    const jobData: CourseEnrollmentJobData = {
      courseId,
      studentId,
      priority,
    };

    const job = await courseEnrollmentQueue.add("enroll-student", jobData, {
      priority,
      delay: 0, // Immediate processing, can be adjusted for delayed enrollment
    });

    return job.id?.toString() || "";
  }

  /**
   * Process course enrollment job
   */
  static async processEnrollmentJob(
    job: Job<CourseEnrollmentJobData>
  ): Promise<EnrollmentResult> {
    const { courseId, studentId } = job.data;

    try {
      // Update job progress
      await job.progress(10);

      // Validate student exists and has correct role
      const student = await UserMongooseModel.findById(studentId);
      if (!student || student.role !== UserRole.STUDENT) {
        throw new Error("Only students can enroll in courses");
      }

      await job.progress(30);

      // Check if course exists and is published
      const course = await CourseModel.findById(courseId);
      if (!course) {
        throw new Error("Course not found");
      }
      if (!course.isPublished) {
        throw new Error("Course is not published");
      }

      await job.progress(50);

      // Check if student is already enrolled
      const isAlreadyEnrolled = course.enrolledStudents.some(
        (enrollment: any) => enrollment.studentId.toString() === studentId
      );

      if (isAlreadyEnrolled) {
        throw new Error("Student is already enrolled in this course");
      }

      await job.progress(70);

      // Check enrollment limit with atomic operation
      const updatedCourse = await CourseMongooseModel.findOneAndUpdate(
        {
          _id: courseId,
          $or: [
            { maxStudents: { $exists: false } },
            {
              $expr: { $lt: [{ $size: "$enrolledStudents" }, "$maxStudents"] },
            },
          ],
        },
        {
          $push: {
            enrolledStudents: {
              studentId,
              studentName: student.username,
              enrolledAt: new Date(),
              progress: 0,
              completedLessons: [],
            },
          },
        },
        { new: true }
      );

      if (!updatedCourse) {
        throw new Error("Course is full or not available for enrollment");
      }

      await job.progress(90);

      // Find the newly added enrollment
      const newEnrollment = updatedCourse.enrolledStudents.find(
        (enrollment: any) => enrollment.studentId.toString() === studentId
      );

      await job.progress(100);

      return {
        success: true,
        enrollmentId: newEnrollment?._id?.toString(),
        message: "Successfully enrolled in course",
      };
    } catch (error) {
      console.error("Enrollment job failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Enrollment failed",
      };
    }
  }

  /**
   * Get job status by ID
   */
  static async getJobStatus(jobId: string): Promise<QueueJobStatus | null> {
    try {
      const job = await courseEnrollmentQueue.getJob(jobId);
      if (!job) return null;

      const status = await job.getState();

      return {
        id: job.id?.toString() || "",
        status: status as any,
        progress: job.progress(),
        result: job.returnvalue,
        error: job.failedReason,
        createdAt: new Date(job.timestamp),
        processedAt: job.processedOn ? new Date(job.processedOn) : undefined,
        finishedAt: job.finishedOn ? new Date(job.finishedOn) : undefined,
      };
    } catch (error) {
      console.error("Error getting job status:", error);
      return null;
    }
  }

  /**
   * Get queue statistics
   */
  static async getQueueStats() {
    const waiting = await courseEnrollmentQueue.getWaiting();
    const active = await courseEnrollmentQueue.getActive();
    const completed = await courseEnrollmentQueue.getCompleted();
    const failed = await courseEnrollmentQueue.getFailed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      total: waiting.length + active.length + completed.length + failed.length,
    };
  }

  /**
   * Cancel a job
   */
  static async cancelJob(jobId: string): Promise<boolean> {
    try {
      const job = await courseEnrollmentQueue.getJob(jobId);
      if (!job) return false;

      await job.remove();
      return true;
    } catch (error) {
      console.error("Error canceling job:", error);
      return false;
    }
  }

  /**
   * Initialize queue processors
   */
  static initializeProcessors() {
    // Process enrollment jobs
    courseEnrollmentQueue.process("enroll-student", 5, async (job) => {
      return await this.processEnrollmentJob(job);
    });

    // Event listeners for monitoring
    courseEnrollmentQueue.on("completed", (job, result) => {
      console.log(`Job ${job.id} completed with result:`, result);
    });

    courseEnrollmentQueue.on("failed", (job, err) => {
      console.error(`Job ${job.id} failed with error:`, err);
    });

    courseEnrollmentQueue.on("stalled", (job) => {
      console.warn(`Job ${job.id} stalled`);
    });

    console.log("Queue processors initialized");
  }
}
