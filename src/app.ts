import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import authRouter from "./routes/auth.routes";
import userRouter from "./routes/user.routes";
import courseRouter from "./routes/course.routes";
import lessonRouter from "./routes/lesson.routes";
import assignmentRouter from "./routes/assignment.routes";
import queueRouter from "./routes/queue.routes";
import { QueueService } from "./services/queue.service";
import path from "path";

dotenv.config();

const app = express();

// Initialize queue processors
QueueService.initializeProcessors();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static('D:\\Semester_1_2024_2025\\Intern-fe\\dist'));

app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
      "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net",
      "img-src 'self' data: https: http:",
      "connect-src 'self' https://cdn.jsdelivr.net",
      "media-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join("; ")
  );
  next();
});

// Routes
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/courses", courseRouter);
app.use("/api/lessons", lessonRouter);
app.use("/api/assignments", assignmentRouter);
app.use("/api/queue", queueRouter);

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ message: "Server is running!" });
});

// Serve frontend for all non-API routes (SPA fallback) - phải đặt cuối cùng
app.get("*", (req: Request, res: Response) => {
  // Chỉ serve index.html cho các route không phải API
  if (!req.path.startsWith('/api') && !req.path.startsWith('/static')) {
    res.sendFile(path.join('D:\\Semester_1_2024_2025\\Intern-fe\\dist', 'index.html'));
  } else {
    res.status(404).json({ message: "Route not found" });
  }
});

// Error handling middleware
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({ message: "Something went wrong!" });
  }
);

// 404 handler
app.use("*", (req: Request, res: Response) => {
  res.status(404).json({ message: "Route not found" });
});

export default app;
