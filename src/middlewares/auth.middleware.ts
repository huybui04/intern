import { Request, Response, NextFunction } from "express";
import { UserRole } from "../interfaces/user.interface";
import { JWTUtils } from "../utils/jwt.utils";
import redisClient from "../services/redis.config";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: UserRole;
  };
}

const TOKEN_CACHE_PREFIX = "auth:token:";

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "Access token required" });
    return;
  }

  try {
    // Check Redis cache first
    const cacheKey = `${TOKEN_CACHE_PREFIX}${token}`;
    const cachedUser = await redisClient.get(cacheKey);

    if (cachedUser) {
      console.log("[AUTH] cache Redis:", cacheKey);
      req.user = JSON.parse(cachedUser);
      next();
      return;
    }

    // Not in cache, verify JWT

    console.log("[AUTH] Verifying JWT token...");
    const decoded = JWTUtils.verifyAccessToken(token);
    if (!decoded) {
      res.status(401).json({ message: "Invalid token" });
      return;
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    // Cache user info for future requests (set TTL, e.g., 15 min)
    await redisClient.set(cacheKey, JSON.stringify(req.user), {
      EX: 60 * 15,
    });
    console.log("[AUTH] cache user in Redis:", cacheKey);

    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};
