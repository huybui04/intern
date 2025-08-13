import { Schema, model, Model, Types } from "mongoose";
import {
  Course,
  CreateCourseInput,
  UpdateCourseInput,
  CourseEnrollment,
} from "../interfaces/course.interface";

// Course Schema
const courseSchema = new Schema<Course>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    instructorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    instructorName: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      required: true,
    },
    duration: {
      type: Number,
      required: true,
      min: 0,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    introVideoUrl: {
      type: String,
    },
    thumbnailUrl: {
      type: String,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    enrolledStudents: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    maxStudents: {
      type: Number,
      min: 1,
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

// Course Enrollment Schema
const courseEnrollmentSchema = new Schema<CourseEnrollment>(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
    completedLessons: [
      {
        type: Schema.Types.ObjectId,
        ref: "Lesson",
      },
    ],
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes
courseSchema.index({ instructorId: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ difficulty: 1 });
courseSchema.index({ isPublished: 1 });
courseSchema.index({ title: "text", description: "text" });

courseEnrollmentSchema.index({ courseId: 1 });
courseEnrollmentSchema.index({ studentId: 1 });
courseEnrollmentSchema.index({ courseId: 1, studentId: 1 }, { unique: true });

// Create models
export const CourseMongooseModel: Model<Course> = model<Course>(
  "Course",
  courseSchema
);
export const CourseEnrollmentMongooseModel: Model<CourseEnrollment> =
  model<CourseEnrollment>("CourseEnrollment", courseEnrollmentSchema);

// Static methods class for backward compatibility
export class CourseModel {
  static async create(
    courseData: CreateCourseInput & {
      instructorId: Types.ObjectId;
      instructorName: string;
    }
  ): Promise<Course> {
    const newCourse = await CourseMongooseModel.create({
      ...courseData,
      enrolledStudents: [],
      isPublished: false,
    });

    return newCourse;
  }

  static async findById(id: string): Promise<Course | null> {
    return CourseMongooseModel.findById(id);
  }

  static async findByInstructor(
    instructorId: string,
    skip: number,
    limit: number,
    filter?: any,
    sort?: any
  ): Promise<{ data: Course[]; totalCount: number }> {
    const baseFilter = { instructorId: new Types.ObjectId(instructorId) };
    const finalFilter = filter ? { ...baseFilter, ...filter } : baseFilter;
    const totalCount = await CourseMongooseModel.countDocuments(finalFilter);
    const data = await CourseMongooseModel.find(finalFilter)
      .sort(sort)
      .skip(skip)
      .limit(limit);
    return { data, totalCount };
  }

  static async findAll(
    skip: number,
    limit: number,
    filter?: any,
    sort?: any
  ): Promise<{ data: Course[]; totalCount: number }> {
    const totalCount = await CourseMongooseModel.countDocuments(filter);
    const data = await CourseMongooseModel.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);
    return { data, totalCount };
  }

  static async updateById(
    id: string,
    updates: UpdateCourseInput
  ): Promise<Course | null> {
    return CourseMongooseModel.findByIdAndUpdate(id, updates, { new: true });
  }

  static async deleteById(id: string): Promise<boolean> {
    const result = await CourseMongooseModel.findByIdAndDelete(id);
    return !!result;
  }

  static async enrollStudent(
    courseId: string,
    studentId: string
  ): Promise<CourseEnrollment> {
    // Check if already enrolled
    const existingEnrollment = await CourseEnrollmentMongooseModel.findOne({
      courseId: new Types.ObjectId(courseId),
      studentId: new Types.ObjectId(studentId),
    });

    if (existingEnrollment) {
      throw new Error("Student already enrolled in this course");
    }

    // Create enrollment
    const enrollment = await CourseEnrollmentMongooseModel.create({
      courseId: new Types.ObjectId(courseId),
      studentId: new Types.ObjectId(studentId),
      enrolledAt: new Date(),
      completedLessons: [],
      progress: 0,
    });

    // Update course enrolled students
    await CourseMongooseModel.findByIdAndUpdate(courseId, {
      $push: { enrolledStudents: new Types.ObjectId(studentId) },
    });

    return enrollment;
  }

  static async findByStudent(
    studentId: string,
    skip: number,
    limit: number,
    filter?: any,
    sort?: any
  ): Promise<{ data: Course[]; totalCount: number }> {
    const enrollments = await CourseEnrollmentMongooseModel.find({
      studentId: new Types.ObjectId(studentId),
    });
    const courseIds = enrollments.map((e) => e.courseId);

    const baseFilter = { _id: { $in: courseIds } };
    const finalFilter = filter ? { ...baseFilter, ...filter } : baseFilter;
    const totalCount = await CourseMongooseModel.countDocuments(finalFilter);
    const data = await CourseMongooseModel.find(finalFilter)
      .sort(sort)
      .skip(skip)
      .limit(limit);
    return { data, totalCount };
  }

  static async getEnrollmentStats(
    courseId: string
  ): Promise<{ totalStudents: number; completedStudents: number }> {
    const enrollments = await CourseEnrollmentMongooseModel.find({
      courseId: new Types.ObjectId(courseId),
    });

    return {
      totalStudents: enrollments.length,
      completedStudents: enrollments.filter((e) => e.completedAt).length,
    };
  }

  static async findRelatedCourses(
    courseId: string,
    skip: number,
    limit: number,
    filter?: any,
    sort?: any
  ): Promise<{ data: Course[]; totalCount: number }> {
    const course = await CourseMongooseModel.findById(courseId).lean();

    if (!course) return { data: [], totalCount: 0 };

    const baseFilter = {
      _id: { $ne: courseId },
      isPublished: true,
      $or: [
        { category: course.category },
        { tags: { $in: course.tags || [] } },
      ],
    };
    const finalFilter = filter ? { ...baseFilter, ...filter } : baseFilter;

    const totalCount = await CourseMongooseModel.countDocuments(finalFilter);
    const relatedCourses = await CourseMongooseModel.find({
      category: course.category,
      _id: { $ne: courseId },
      isPublished: true,
    })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    return { data: relatedCourses, totalCount };
  }
}
