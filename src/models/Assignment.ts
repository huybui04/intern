import { Schema, model, Model, Types } from "mongoose";
import {
  Assignment,
  AssignmentSubmission,
  CreateAssignmentInput,
  UpdateAssignmentInput,
  GradeAssignmentInput,
} from "../interfaces/assignment.interface";

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
      courseId: new Types.ObjectId(assignmentData.courseId),
      lessonId: assignmentData.lessonId
        ? new Types.ObjectId(assignmentData.lessonId)
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
    const baseFilter = { courseId: new Types.ObjectId(courseId) };
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
    const baseFilter = { lessonId: new Types.ObjectId(lessonId) };
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
    // Check if already submitted
    const existingSubmission = await AssignmentSubmissionMongooseModel.findOne({
      assignmentId: new Types.ObjectId(assignmentId),
      studentId: new Types.ObjectId(studentId),
    });

    if (existingSubmission) {
      throw new Error("Assignment already submitted");
    }

    const submission = await AssignmentSubmissionMongooseModel.create({
      assignmentId: new Types.ObjectId(assignmentId),
      studentId: new Types.ObjectId(studentId),
      answers,
      submittedAt: new Date(),
    });

    return submission;
  }

  static async findSubmission(
    assignmentId: string,
    studentId: string
  ): Promise<AssignmentSubmission | null> {
    return AssignmentSubmissionMongooseModel.findOne({
      assignmentId: new Types.ObjectId(assignmentId),
      studentId: new Types.ObjectId(studentId),
    });
  }

  static async getSubmissionsByAssignment(
    assignmentId: string
  ): Promise<AssignmentSubmission[]> {
    return AssignmentSubmissionMongooseModel.find({
      assignmentId: new Types.ObjectId(assignmentId),
    });
  }

  static async gradeSubmission(
    submissionId: string,
    gradeData: GradeAssignmentInput,
    gradedBy: string
  ): Promise<AssignmentSubmission | null> {
    return AssignmentSubmissionMongooseModel.findByIdAndUpdate(
      submissionId,
      {
        score: gradeData.score,
        feedback: gradeData.feedback,
        gradedAt: new Date(),
        gradedBy: new Types.ObjectId(gradedBy),
      },
      { new: true }
    );
  }

  static async getStudentSubmissions(
    studentId: string
  ): Promise<AssignmentSubmission[]> {
    return AssignmentSubmissionMongooseModel.find({
      studentId: new Types.ObjectId(studentId),
    });
  }

  static async deleteSubmission(
    assignmentId: string,
    studentId: string
  ): Promise<boolean> {
    const result = await AssignmentSubmissionMongooseModel.findOneAndDelete({
      assignmentId: new Types.ObjectId(assignmentId),
      studentId: new Types.ObjectId(studentId),
    });
    return !!result;
  }
}
