import mongoose from "mongoose";

// Database utilities for Mongoose
export class DatabaseService {
  static isValidObjectId(id: string): boolean {
    return mongoose.Types.ObjectId.isValid(id);
  }

  static createObjectId(id?: string): mongoose.Types.ObjectId {
    return id ? new mongoose.Types.ObjectId(id) : new mongoose.Types.ObjectId();
  }

  static toObjectId(id: string): mongoose.Types.ObjectId {
    return new mongoose.Types.ObjectId(id);
  }
}
