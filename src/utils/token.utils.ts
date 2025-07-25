import crypto from "crypto";

/**
 * Generate a random reset token
 * @returns string - Random token for password reset
 */
export const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

/**
 * Generate reset token expiry time (1 hour from now)
 * @returns Date - Expiry time for the reset token
 */
export const generateResetTokenExpiry = (): Date => {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 1); // Token expires in 1 hour
  return expiry;
};
