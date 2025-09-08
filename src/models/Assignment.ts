import { Schema, model, Model, Types } from "mongoose";
import {
  Assignment,
  AssignmentSubmission,
  CreateAssignmentInput,
  UpdateAssignmentInput,
  GradeAssignmentInput,
} from "../interfaces/assignment.interface";
import { toObjectId, isValidObjectId } from "../utils/objectId.utils";

// Assignment Question Schema
const assignmentQuestionSchema = new Schema({
  question: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["multiple_choice", "essay", "true_false"],
    required: true,
  },
  options: {
    type: [String],
  },
  correctAnswer: {
    type: Schema.Types.Mixed,
  },
  points: {
    type: Number,
    required: true,
    min: 0,
  },
});

// Assignment Schema
const assignmentSchema = new Schema<Assignment>(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    lessonId: {
      type: Schema.Types.ObjectId,
      ref: "Lesson",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    questions: [assignmentQuestionSchema],
    totalPoints: {
      type: Number,
      required: true,
      min: 0,
    },
    dueDate: {
      type: Date,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Assignment Submission Schema
const submissionAnswerSchema = new Schema({
  questionId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  answer: {
    type: Schema.Types.Mixed,
    required: true,
  },
});

const assignmentSubmissionSchema = new Schema<AssignmentSubmission>(
  {
    assignmentId: {
      type: Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    answers: [submissionAnswerSchema],
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    score: {
      type: Number,
      min: 0,
    },
    feedback: {
      type: String,
    },
    status: {
      type: String,
      enum: ["submitted", "graded", "late"],
      default: "submitted",
    },
    gradedAt: {
      type: Date,
    },
    gradedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes
assignmentSchema.index({ courseId: 1 });
assignmentSchema.index({ lessonId: 1 });
assignmentSchema.index({ isPublished: 1 });

assignmentSubmissionSchema.index({ assignmentId: 1 });
assignmentSubmissionSchema.index({ studentId: 1 });
assignmentSubmissionSchema.index(
  { assignmentId: 1, studentId: 1 },
  { unique: true }
);

// Create models
export const AssignmentMongooseModel: Model<Assignment> = model<Assignment>(
  "Assignment",
  assignmentSchema
);
export const AssignmentSubmissionMongooseModel: Model<AssignmentSubmission> =
  model<AssignmentSubmission>(
    "AssignmentSubmission",
    assignmentSubmissionSchema
  );

export class AssignmentModel {
  static async findAll(
    skip: number,
    limit: number,
    filter?: any,
    sort?: any
  ): Promise<{ data: Assignment[]; totalCount: number }> {
    const totalCount = await AssignmentMongooseModel.countDocuments(filter);
    const data = await AssignmentMongooseModel.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);
    return { data, totalCount };
  }

  static async countWithQuery(filter: any) {
    return AssignmentMongooseModel.countDocuments(filter);
  }

  static async createAssignment(
    assignmentData: CreateAssignmentInput
  ): Promise<Assignment> {
    const totalPoints = assignmentData.questions.reduce(
      (total, q) => total + q.points,
      0
    );

    const newAssignment = await AssignmentMongooseModel.create({
      ...assignmentData,
      courseId: toObjectId(assignmentData.courseId),
      lessonId: assignmentData.lessonId
        ? toObjectId(assignmentData.lessonId)
        : undefined,
      totalPoints,
      isPublished: false,
    });

    return newAssignment;
  }

  static async findById(id: string): Promise<Assignment | null> {
    return AssignmentMongooseModel.findById(id);
  }

  static async findByCourse(
    courseId: string,
    skip: number,
    limit: number,
    filter?: any,
    sort?: any
  ): Promise<{ data: Assignment[]; totalCount: number }> {
    if (!isValidObjectId(courseId)) {
      throw new Error(`Invalid course ID format: ${courseId}`);
    }
    
    const baseFilter = { courseId: toObjectId(courseId) };
    const finalFilter = filter ? { ...baseFilter, ...filter } : baseFilter;
    const totalCount = await AssignmentMongooseModel.countDocuments(
      finalFilter
    );

    const data = await AssignmentMongooseModel.find(finalFilter)
      .sort(sort)
      .skip(skip)
      .limit(limit);
    return { data, totalCount };
  }

  static async findByLesson(
    lessonId: string,
    skip: number,
    limit: number,
    filter?: any,
    sort?: any
  ): Promise<{ data: Assignment[]; totalCount: number }> {
    if (!isValidObjectId(lessonId)) {
      throw new Error(`Invalid lesson ID format: ${lessonId}`);
    }
    
    const baseFilter = { lessonId: toObjectId(lessonId) };
    const finalFilter = filter ? { ...baseFilter, ...filter } : baseFilter;
    const totalCount = await AssignmentMongooseModel.countDocuments(
      finalFilter
    );
    const data = await AssignmentMongooseModel.find(finalFilter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
    const dataWithCount = data.map((assignment: any) => ({
      ...assignment,
    }));
    return { data: dataWithCount, totalCount };
  }

  static async updateById(
    id: string,
    updates: UpdateAssignmentInput
  ): Promise<Assignment | null> {
    const updateData: any = { ...updates };

    if (updates.questions) {
      updateData.totalPoints = updates.questions.reduce(
        (total, q) => total + q.points,
        0
      );
    }

    return AssignmentMongooseModel.findByIdAndUpdate(id, updateData, {
      new: true,
    });
  }

  static async deleteById(id: string): Promise<boolean> {
    const result = await AssignmentMongooseModel.findByIdAndDelete(id);
    return !!result;
  }

  // Assignment Submission Methods
  static async submitAssignment(
    assignmentId: string,
    studentId: string,
    answers: any[]
  ): Promise<AssignmentSubmission> {
    if (!isValidObjectId(assignmentId)) {
      throw new Error(`Invalid assignment ID format: ${assignmentId}`);
    }
    if (!isValidObjectId(studentId)) {
      throw new Error(`Invalid student ID format: ${studentId}`);
    }

    const assignment = await AssignmentMongooseModel.findById(toObjectId(assignmentId));
    if (!assignment) {
      throw new Error("Assignment not found");
    }

    const existingSubmission = await AssignmentSubmissionMongooseModel.findOne({
      assignmentId: toObjectId(assignmentId),
      studentId: toObjectId(studentId),
    });

    if (existingSubmission) {
      throw new Error("Assignment already submitted");
    }

    const now = new Date();
    const isLate = assignment.dueDate && now > assignment.dueDate;
    const status = isLate ? "late" : "submitted";

    console.log("Creating submission:", {
      assignmentId,
      studentId,
      status,
      isLate,
      dueDate: assignment.dueDate,
      currentTime: now
    });

    const submission = await AssignmentSubmissionMongooseModel.create({
      assignmentId: toObjectId(assignmentId),
      studentId: toObjectId(studentId),
      answers,
      submittedAt: now,
      status: status,
    });

    return submission;
  }

  static async findSubmission(
    assignmentId: string,
    studentId: string
  ): Promise<AssignmentSubmission | null> {
    if (!isValidObjectId(assignmentId)) {
      throw new Error(`Invalid assignment ID format: ${assignmentId}`);
    }
    if (!isValidObjectId(studentId)) {
      throw new Error(`Invalid student ID format: ${studentId}`);
    }

    return AssignmentSubmissionMongooseModel.findOne({
      assignmentId: toObjectId(assignmentId),
      studentId: toObjectId(studentId),
    });
  }

  static async getSubmissionsByAssignment(
    assignmentId: string
  ): Promise<AssignmentSubmission[]> {
    if (!isValidObjectId(assignmentId)) {
      throw new Error(`Invalid assignment ID format: ${assignmentId}`);
    }

    return AssignmentSubmissionMongooseModel.find({
      assignmentId: toObjectId(assignmentId),
    }).populate("studentId", "username email avatar");
  }

  static async gradeSubmission(
    submissionId: string,
    gradeData: GradeAssignmentInput,
    gradedBy: string
  ): Promise<AssignmentSubmission | null> {
    // Validate ObjectId formats
    if (!isValidObjectId(submissionId)) {
      throw new Error(`Invalid submission ID format: ${submissionId}`);
    }
    if (!isValidObjectId(gradedBy)) {
      throw new Error(`Invalid grader ID format: ${gradedBy}`);
    }

    console.log("Grading submission:", {
      submissionId,
      score: gradeData.score,
      scoreType: typeof gradeData.score,
      feedback: gradeData.feedback,
      gradedBy,
      fullGradeData: gradeData
    });

    // Validate and parse score
    let parsedScore: number;
    if (gradeData.score === undefined || gradeData.score === null) {
      throw new Error("Score is required");
    }
    
    if (typeof gradeData.score === 'string') {
      parsedScore = parseFloat(gradeData.score);
    } else {
      parsedScore = Number(gradeData.score);
    }
    
    if (isNaN(parsedScore)) {
      throw new Error(`Invalid score value: ${gradeData.score}. Score must be a valid number.`);
    }

    const currentSubmission = await AssignmentSubmissionMongooseModel.findById(toObjectId(submissionId));
    if (!currentSubmission) {
      throw new Error("Submission not found");
    }

    const updateData = {
      score: parsedScore,
      feedback: gradeData.feedback || "",
      status: "graded" as const, // Always set to "graded" when manually graded
      gradedAt: new Date(),
      gradedBy: toObjectId(gradedBy),
    };

    console.log("Update data:", updateData);

    const result = await AssignmentSubmissionMongooseModel.findByIdAndUpdate(
      toObjectId(submissionId),
      updateData,
      { new: true, runValidators: true }
    );

    console.log("Grade submission result:", result);
    return result;
  }

  static async getStudentSubmissions(
    studentId: string
  ): Promise<AssignmentSubmission[]> {
    if (!isValidObjectId(studentId)) {
      throw new Error(`Invalid student ID format: ${studentId}`);
    }
    return AssignmentSubmissionMongooseModel.find({
      studentId: toObjectId(studentId),
    });
  }

  static async getSubmissionById(
    submissionId: string
  ): Promise<AssignmentSubmission | null> {
    if (!isValidObjectId(submissionId)) {
      throw new Error(`Invalid submission ID format: ${submissionId}`);
    }
    return AssignmentSubmissionMongooseModel.findById(toObjectId(submissionId));
  }

  static async deleteSubmission(
    assignmentId: string,
    studentId: string
  ): Promise<boolean> {
    if (!isValidObjectId(assignmentId)) {
      throw new Error(`Invalid assignment ID format: ${assignmentId}`);
    }
    if (!isValidObjectId(studentId)) {
      throw new Error(`Invalid student ID format: ${studentId}`);
    }

    const result = await AssignmentSubmissionMongooseModel.findOneAndDelete({
      assignmentId: toObjectId(assignmentId),
      studentId: toObjectId(studentId),
    });
    return !!result;
  }

  static async getSubmissionDetailById(
    submissionId: string
  ): Promise<AssignmentSubmission | null> {
    return AssignmentSubmissionMongooseModel.findById(submissionId)
      .populate("assignmentId")
      .populate("studentId", "username email avatar");
  }
}
