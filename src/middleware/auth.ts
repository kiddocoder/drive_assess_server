/**
 * Authentication Middleware
 *
 * Handles JWT token verification and role-based access control:
 * - Token validation
 * - User authentication
 * - Role-based authorization
 * - Request context enhancement
 */

import type { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { User } from "../models/User"
import { Logger } from "../utils/Logger"

interface AuthRequest extends Request {
  user?: {
    userId: string
    role: string
  }
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(" ")[1] // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Access token is required",
      })
      return
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    // Check if user still exists and is active
    const user = await User.findById(decoded.userId)
    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      })
      return
    }

    // Add user info to request
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    }

    next()
  } catch (error: any) {
    Logger.error("Authentication error:", error)
    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    })
  }
}

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      })
      return
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: "Insufficient permissions",
      })
      return
    }

    next()
  }
}

export const requireOwnership = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params
    const userId = req.user?.userId

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      })
      return
    }

    // Allow admins to access any resource
    if (req.user?.role === "admin") {
      next()
      return
    }

    // Check if user owns the resource or is accessing their own data
    if (id !== userId) {
      res.status(403).json({
        success: false,
        message: "Access denied",
      })
      return
    }

    next()
  } catch (error: any) {
    Logger.error("Ownership check error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
}
