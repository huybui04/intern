import Bull from "bull";
import Redis from "ioredis";

// Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || "0"),
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  lazyConnect: true, // Don't connect immediately
};

// Create Redis connection with error handling
export const redisConnection = new Redis(redisConfig);

// Handle Redis connection events
redisConnection.on("connect", () => {
  console.log("📡 Redis connected successfully");
});

redisConnection.on("error", (error) => {
  console.warn(
    "⚠️  Redis connection error (Queue will work without Redis in development):",
    error.message
  );
});

redisConnection.on("close", () => {
  console.log("📡 Redis connection closed");
});

// Course enrollment queue with fallback
export const courseEnrollmentQueue = new Bull("course-enrollment", {
  redis: redisConfig,
  defaultJobOptions: {
    removeOnComplete: 10, // Keep only 10 completed jobs
    removeOnFail: 50, // Keep 50 failed jobs for debugging
    attempts: 3, // Retry failed jobs 3 times
    backoff: {
      type: "exponential",
      delay: 2000, // Start with 2 seconds delay
    },
  },
  settings: {
    stalledInterval: 30 * 1000, // 30 seconds
    maxStalledCount: 1,
  },
});

// Handle queue events
courseEnrollmentQueue.on("error", (error) => {
  console.warn("⚠️  Queue error (will continue working):", error.message);
});

// Graceful shutdown with error handling
const gracefulShutdown = async () => {
  try {
    console.log("🔄 Gracefully shutting down queue and Redis...");
    await courseEnrollmentQueue.close();
    if (redisConnection.status === "ready") {
      await redisConnection.quit();
    }
    console.log("✅ Queue and Redis shutdown complete");
  } catch (error) {
    console.warn("⚠️  Error during shutdown:", error);
  }
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);
