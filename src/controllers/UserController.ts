/**
 * User Controller
 *
 * Handles user management operations:
 * - User CRUD operations
 * - Role management
 * - Profile updates
 * - User statistics
 * - Bulk operations
 */

import type { Request, Response } from "express"
import { validationResult } from "express-validator"
import { User } from "../models/User"
import { Result } from "../models/Result"
import { Payment } from "../models/Payment"
import { Logger } from "../utils/Logger"

export class UserController {
  public getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page = 1, limit = 10, role, search, sortBy = "createdAt", sortOrder = "desc", isActive } = req.query

      // Build filter object
      const filter: any = {}
      if (role) filter.role = role
      if (search) {
        filter.$or = [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }]
      }
      if (isActive !== undefined) filter.isActive = isActive === "true"

      // Build sort object
      const sort: any = {}
      sort[sortBy as string] = sortOrder === "desc" ? -1 : 1

      const skip = (Number(page) - 1) * Number(limit)

      const [users, total] = await Promise.all([
        User.find(filter).sort(sort).skip(skip).limit(Number(limit)).select("-password"),
        User.countDocuments(filter),
      ])

      res.status(200).json({
        success: true,
        data: {
          users,
          pagination: {
            current: Number(page),
            pages: Math.ceil(total / Number(limit)),
            total,
            limit: Number(limit),
          },
        },
      })
    } catch (error: any) {
      Logger.error("Get all users error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to fetch users",
      })
    }
  }

  public getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params

      const user = await User.findById(id).select("-password")
      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found",
        })
        return
      }

      // Get user statistics
      const [testResults, payments] = await Promise.all([
        Result.find({ student: id }).populate("test", "title"),
        Payment.find({ user: id }),
      ])

      const stats = {
        testsCompleted: testResults.filter((r) => r.status === "completed").length,
        averageScore:
          testResults.length > 0 ? testResults.reduce((sum, r) => sum + r.percentage, 0) / testResults.length : 0,
        totalSpent: payments.filter((p) => p.status === "completed").reduce((sum, p) => sum + p.amount, 0),
        lastActivity: user.lastLogin,
      }

      res.status(200).json({
        success: true,
        data: {
          user,
          stats,
          recentResults: testResults.slice(0, 5),
          recentPayments: payments.slice(0, 5),
        },
      })
    } catch (error: any) {
      Logger.error("Get user by ID error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to fetch user",
      })
    }
  }

  public createUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
        return
      }

      const userData = req.body

      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email })
      if (existingUser) {
        res.status(409).json({
          success: false,
          message: "User already exists with this email",
        })
        return
      }

      const user = new User(userData)
      await user.save()

      Logger.info(`User created: ${user.email} by admin`)

      res.status(201).json({
        success: true,
        message: "User created successfully",
        data: { user },
      })
    } catch (error: any) {
      Logger.error("Create user error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to create user",
      })
    }
  }

  public updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const updates = req.body

      // Remove sensitive fields
      delete updates.password
      delete updates.loginAttempts
      delete updates.lockUntil

      const user = await User.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true }).select(
        "-password",
      )

      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found",
        })
        return
      }

      Logger.info(`User updated: ${user.email}`)

      res.status(200).json({
        success: true,
        message: "User updated successfully",
        data: { user },
      })
    } catch (error: any) {
      Logger.error("Update user error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to update user",
      })
    }
  }

  public deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params

      const user = await User.findByIdAndDelete(id)
      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found",
        })
        return
      }

      Logger.info(`User deleted: ${user.email}`)

      res.status(200).json({
        success: true,
        message: "User deleted successfully",
      })
    } catch (error: any) {
      Logger.error("Delete user error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to delete user",
      })
    }
  }

  public toggleUserStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params

      const user = await User.findById(id)
      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found",
        })
        return
      }

      user.isActive = !user.isActive
      await user.save()

      Logger.info(`User status toggled: ${user.email} - ${user.isActive ? "activated" : "deactivated"}`)

      res.status(200).json({
        success: true,
        message: `User ${user.isActive ? "activated" : "deactivated"} successfully`,
        data: { user },
      })
    } catch (error: any) {
      Logger.error("Toggle user status error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to toggle user status",
      })
    }
  }

  public getUserStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const [totalUsers, activeUsers, studentsCount, instructorsCount, recentUsers] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ isActive: true }),
        User.countDocuments({ role: "student" }),
        User.countDocuments({ role: "instructor" }),
        User.find().sort({ createdAt: -1 }).limit(10).select("name email role createdAt"),
      ])

      const stats = {
        total: totalUsers,
        active: activeUsers,
        students: studentsCount,
        instructors: instructorsCount,
        admins: totalUsers - studentsCount - instructorsCount,
        recent: recentUsers,
      }

      res.status(200).json({
        success: true,
        data: stats,
      })
    } catch (error: any) {
      Logger.error("Get user stats error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to fetch user statistics",
      })
    }
  }
}

export default new UserController()