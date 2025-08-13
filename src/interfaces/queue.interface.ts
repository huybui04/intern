export interface CourseEnrollmentJobData {
  courseId: string;
  studentId: string;
  enrollmentId?: string;
  priority?: number;
}

export interface EnrollmentResult {
  success: boolean;
  enrollmentId?: string;
  message?: string;
  error?: string;
}

export enum JobPriority {
  LOW = 1,
  NORMAL = 5,
  HIGH = 10,
  CRITICAL = 15,
}

export interface QueueJobStatus {
  id: string;
  status: "waiting" | "active" | "completed" | "failed" | "delayed";
  progress?: number;
  result?: any;
  error?: string;
  createdAt: Date;
  processedAt?: Date;
  finishedAt?: Date;
}
