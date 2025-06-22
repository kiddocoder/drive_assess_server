/**
 * Test Controller
 *
 * Handles test/quiz management:
 * - Test CRUD operations
 * - Question management
 * - Test publishing and scheduling
 * - Performance analytics
 * - Bulk operations
 */

import type { Request, Response } from "express"
import { validationResult } from "express-validator"
import { Test } from "../models/Test"
import { Question } from "../models/Question"
import { Result } from "../models/Result"
import { Logger } from "../utils/Logger"
import { Types } from "mongoose"

export class TestController {
  public getAllTests = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        page = 1,
        limit = 10,
        category,
        difficulty,
        instructor,
        search,
        status,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query

      // Build filter object
      const filter: any = {}
      if (category) filter.category = category
      if (difficulty) filter.difficulty = difficulty
      if (instructor) filter.instructor = instructor
      if (status) {
        if (status === "published") filter.isPublished = true
        if (status === "draft") filter.isPublished = false
      }
      if (search) {
        filter.$or = [{ title: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }]
      }

      // Build sort object
      const sort: any = {}
      sort[sortBy as string] = sortOrder === "desc" ? -1 : 1

      const skip = (Number(page) - 1) * Number(limit)

      const [tests, total] = await Promise.all([
        Test.find(filter)
          .populate("category", "name color")
          .populate("instructor", "name email")
          .sort(sort)
          .skip(skip)
          .limit(Number(limit)),
        Test.countDocuments(filter),
      ])

      res.status(200).json({
        success: true,
        data: {
          tests,
          pagination: {
            current: Number(page),
            pages: Math.ceil(total / Number(limit)),
            total,
            limit: Number(limit),
          },
        },
      })
    } catch (error: any) {
      Logger.error("Get all tests error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to fetch tests",
      })
    }
  }

  public getTestById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params

      const test = await Test.findById(id)
        .populate("category", "name color")
        .populate("instructor", "name email")
        .populate("questions")

      if (!test) {
        res.status(404).json({
          success: false,
          message: "Test not found",
        })
        return
      }

      // Get test statistics
      const results = await Result.find({ test: id })
      const stats = {
        totalAttempts: results.length,
        completedAttempts: results.filter((r) => r.status === "completed").length,
        averageScore: results.length > 0 ? results.reduce((sum, r) => sum + r.percentage, 0) / results.length : 0,
        passRate: results.length > 0 ? (results.filter((r) => r.passed).length / results.length) * 100 : 0,
      }

      res.status(200).json({
        success: true,
        data: {
          test,
          stats,
        },
      })
    } catch (error: any) {
      Logger.error("Get test by ID error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to fetch test",
      })
    }
  }

  public createTest = async (req: Request, res: Response): Promise<void> => {
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

      const testData = {
        ...req.body,
        instructor: (req as any).user.userId,
      }

      const test = new Test(testData)
      await test.save()

      await test.populate("category", "name color")

      Logger.info(`Test created: ${test.title} by ${(req as any).user.userId}`)

      res.status(201).json({
        success: true,
        message: "Test created successfully",
        data: { test },
      })
    } catch (error: any) {
      Logger.error("Create test error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to create test",
      })
    }
  }

  public updateTest = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const updates = req.body

      const test = await Test.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true }).populate(
        "category",
        "name color",
      )

      if (!test) {
        res.status(404).json({
          success: false,
          message: "Test not found",
        })
        return
      }

      Logger.info(`Test updated: ${test.title}`)

      res.status(200).json({
        success: true,
        message: "Test updated successfully",
        data: { test },
      })
    } catch (error: any) {
      Logger.error("Update test error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to update test",
      })
    }
  }

  public deleteTest = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params

      const test = await Test.findByIdAndDelete(id)
      if (!test) {
        res.status(404).json({
          success: false,
          message: "Test not found",
        })
        return
      }

      // Also delete related results
      await Result.deleteMany({ test: id })

      Logger.info(`Test deleted: ${test.title}`)

      res.status(200).json({
        success: true,
        message: "Test deleted successfully",
      })
    } catch (error: any) {
      Logger.error("Delete test error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to delete test",
      })
    }
  }

  public publishTest = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params

      const test = await Test.findById(id)
      if (!test) {
        res.status(404).json({
          success: false,
          message: "Test not found",
        })
        return
      }

      if (test.questions.length === 0) {
        res.status(400).json({
          success: false,
          message: "Cannot publish test without questions",
        })
        return
      }

      test.isPublished = !test.isPublished
      await test.save()

      Logger.info(`Test ${test.isPublished ? "published" : "unpublished"}: ${test.title}`)

      res.status(200).json({
        success: true,
        message: `Test ${test.isPublished ? "published" : "unpublished"} successfully`,
        data: { test },
      })
    } catch (error: any) {
      Logger.error("Publish test error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to publish test",
      })
    }
  }

  public addQuestionToTest = async (req: Request, res: Response): Promise<void> => {
    try {
      const { testId, questionId } = req.params

      const [test, question] = await Promise.all([Test.findById(testId), Question.findById(questionId)])

      if (!test) {
        res.status(404).json({
          success: false,
          message: "Test not found",
        })
        return
      }

      if (!question) {
        res.status(404).json({
          success: false,
          message: "Question not found",
        })
        return
      }

      if (test.questions.includes(question._id as Types.ObjectId)) {
        res.status(400).json({
          success: false,
          message: "Question already added to test",
        })
        return
      }

      test.questions.push(question._id as Types.ObjectId)
      await test.save()

      res.status(200).json({
        success: true,
        message: "Question added to test successfully",
        data: { test },
      })
    } catch (error: any) {
      Logger.error("Add question to test error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to add question to test",
      })
    }
  }

  public removeQuestionFromTest = async (req: Request, res: Response): Promise<void> => {
    try {
      const { testId, questionId } = req.params

      const test = await Test.findById(testId)
      if (!test) {
        res.status(404).json({
          success: false,
          message: "Test not found",
        })
        return
      }

      test.questions = test.questions.filter((q) => q.toString() !== questionId)
      await test.save()

      res.status(200).json({
        success: true,
        message: "Question removed from test successfully",
        data: { test },
      })
    } catch (error: any) {
      Logger.error("Remove question from test error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to remove question from test",
      })
    }
  }
}

export default new TestController()