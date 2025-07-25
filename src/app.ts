import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import authRouter from "./routes/auth.routes";
import userRouter from "./routes/user.routes";
import courseRouter from "./routes/course.routes";
import lessonRouter from "./routes/lesson.routes";
import assignmentRouter from "./routes/assignment.routes";

dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/courses", courseRouter);
app.use("/api/lessons", lessonRouter);
app.use("/api/assignments", assignmentRouter);

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ message: "Server is running!" });
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
