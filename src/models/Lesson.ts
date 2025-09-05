import { Schema, model, Model, Types } from "mongoose";
import {
  Lesson,
  CreateLessonInput,
  UpdateLessonInput,
} from "../interfaces/lesson.interface";

const lessonSchema = new Schema<Lesson>(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      index: true, // SEO + URL-friendly
    },
    description: {
      type: String,
      required: true,
    },
    content: {
      type: String, // Can save HTML/Markdown
      required: true,
    },

    // Media
    videoUrl: {
      type: String,
    },
    attachments: [
      {
        name: String,
        fileUrl: String,
        fileType: String,
      },
    ],

    // Metadata
    order: {
      type: Number,
      required: true,
      min: 1,
    },
    duration: {
      type: Number, // in minutes
      required: false,
      min: 1,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },

    // Tracking
    // prerequisites: [{ type: Schema.Types.ObjectId, ref: "Lesson" }],
    // quizId: {
    //   type: Schema.Types.ObjectId,
    //   ref: "Assignment",
    // },

    // SEO / Analytics
    viewsCount: {
      type: Number,
      default: 0,
    },
    tags: [String],
  },
  {
    timestamps: true,
  }
);

lessonSchema.index({ courseId: 1 });
lessonSchema.index({ courseId: 1, order: 1 });
lessonSchema.index({ isPublished: 1 });

export const LessonMongooseModel: Model<Lesson> = model<Lesson>(
  "Lesson",
  lessonSchema
);

export class LessonModel {
  static async findAll(
    skip: number,
    limit: number,
    filter?: any,
    sort?: any
  ): Promise<{ data: Lesson[]; totalCount: number }> {
    const totalCount = await LessonMongooseModel.countDocuments();
    const data = await LessonMongooseModel.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);
    return { data, totalCount };
  }

  static async findWithQuery(
    filter: any,
    sort: any,
    skip: number,
    limit: number
  ) {
    return LessonMongooseModel.find(filter).sort(sort).skip(skip).limit(limit);
  }
  static async countWithQuery(filter: any) {
    return LessonMongooseModel.countDocuments(filter);
  }
  static async create(lessonData: CreateLessonInput): Promise<Lesson> {
    const newLesson = await LessonMongooseModel.create({
      ...lessonData,
      courseId: new Types.ObjectId(lessonData.courseId),
      isPublished: false,
    });

    return newLesson;
  }

  static async findById(id: string): Promise<Lesson | null> {
    return LessonMongooseModel.findById(id);
  }

  static async findByCourse(
    courseId: string,
    skip: number,
    limit: number,
    filter?: any,
    sort?: any
  ): Promise<{ data: Lesson[]; totalCount: number }> {
    const totalCount = await LessonMongooseModel.countDocuments(
      new Types.ObjectId(courseId)
    );
    const data = await LessonMongooseModel.find({
      courseId: new Types.ObjectId(courseId),
    })
      .sort(sort)
      .skip(skip)
      .limit(limit);
    return { data, totalCount };
  }

  static async updateById(
    id: string,
    updates: UpdateLessonInput
  ): Promise<Lesson | null> {
    return LessonMongooseModel.findByIdAndUpdate(id, updates, { new: true });
  }

  static async deleteById(id: string): Promise<boolean> {
    const result = await LessonMongooseModel.findByIdAndDelete(id);
    return !!result;
  }

  static async reorderLessons(
    courseId: string,
    lessonOrders: { lessonId: string; order: number }[]
  ): Promise<void> {
    for (const { lessonId, order } of lessonOrders) {
      await LessonMongooseModel.findOneAndUpdate(
        {
          _id: new Types.ObjectId(lessonId),
          courseId: new Types.ObjectId(courseId),
        },
        { $set: { order } }
      );
    }
  }
}
