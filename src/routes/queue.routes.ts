import { Router, Request, Response } from "express";
import { QueueService } from "../services/queue.service";
import { authenticateToken } from "../middlewares/auth.middleware";
import { requireInstructorOrAdmin } from "../middlewares/roles.middleware";

const queueRouter = Router();

// Apply authentication middleware
queueRouter.use(authenticateToken);
queueRouter.use(requireInstructorOrAdmin);

// Get queue statistics
queueRouter.get("/stats", async (req: Request, res: Response) => {
  try {
    const stats = await QueueService.getQueueStats();
    res.status(200).json({
      success: true,
      message: "Queue statistics retrieved successfully",
      data: stats,
    });
  } catch (error) {
    console.error("Get queue stats error:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
});

// Get job status by ID
queueRouter.get("/job/:jobId", async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const status = await QueueService.getJobStatus(jobId);

    if (!status) {
      res.status(404).json({
        success: false,
        message: "Job not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Job status retrieved successfully",
      data: status,
    });
  } catch (error) {
    console.error("Get job status error:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
});

// Cancel a job
queueRouter.delete("/job/:jobId", async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const cancelled = await QueueService.cancelJob(jobId);

    if (!cancelled) {
      res.status(404).json({
        success: false,
        message: "Job not found or cannot be cancelled",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Job cancelled successfully",
    });
  } catch (error) {
    console.error("Cancel job error:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
});

export default queueRouter;
