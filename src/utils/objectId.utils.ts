import { Types } from "mongoose";

/**
 * Validates if a string is a valid MongoDB ObjectId
 * @param id - String to validate
 * @returns boolean - true if valid ObjectId format
 */
export const isValidObjectId = (id: string): boolean => {
  return Types.ObjectId.isValid(id) && /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Safely converts a string to ObjectId with validation
 * @param id - String to convert
 * @returns Types.ObjectId - Valid ObjectId
 * @throws Error if invalid ObjectId format
 */
export const toObjectId = (id: string): Types.ObjectId => {
  if (!isValidObjectId(id)) {
    throw new Error(`Invalid ObjectId format: ${id}`);
  }
  return new Types.ObjectId(id);
};

/**
 * Safely converts a string to ObjectId, returns null if invalid
 * @param id - String to convert
 * @returns Types.ObjectId | null - Valid ObjectId or null
 */
export const toObjectIdSafe = (id: string): Types.ObjectId | null => {
  try {
    return toObjectId(id);
  } catch {
    return null;
  }
};

/**
 * Validates an array of ObjectId strings
 * @param ids - Array of strings to validate
 * @returns boolean - true if all are valid ObjectIds
 */
export const areValidObjectIds = (ids: string[]): boolean => {
  return ids.every(id => isValidObjectId(id));
};
