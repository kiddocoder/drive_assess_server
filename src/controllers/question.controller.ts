/**
 * Question Controller
 *
 * Handles question bank management:
 * - Question CRUD operations
 * - Question categorization
 * - Bulk import/export
 * - Question analytics
 * - Media management
 */

import type { Request, Response } from "express"
import { validationResult } from "express-validator"
import { Question } from "../models/Question"
import { Logger } from "../utils/Logger"

export class QuestionController {
  public getAllQuestions = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        page = 1,
        limit = 10,
        category,
        difficulty,
        type,
        search,
        createdBy,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query

      // Build filter object
      const filter: any = { isActive: true }
      if (category) filter.category = category
      if (difficulty) filter.difficulty = difficulty
      if (type) filter.type = type
      if (createdBy) filter.createdBy = createdBy
      if (search) {
        filter.$or = [{ title: { $regex: search, $options: "i" } }, { content: { $regex: search, $options: "i" } }]
      }

      // Build sort object
      const sort: any = {}
      sort[sortBy as string] = sortOrder === "desc" ? -1 : 1

      const skip = (Number(page) - 1) * Number(limit)

      const [questions, total] = await Promise.all([
        Question.find(filter)
          .populate("category", "name color")
          .populate("createdBy", "name email")
          .sort(sort)
          .skip(skip)
          .limit(Number(limit)),
        Question.countDocuments(filter),
      ])

      res.status(200).json({
        success: true,
         pagination: {
            current: Number(page),
            pages: Math.ceil(total / Number(limit)),
            total,
            limit: Number(limit),
          },
        data: questions,
      })
    } catch (error: any) {
      Logger.error("Get all questions error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to fetch questions",
      })
    }
  }

   public getRandomQuestions = async (req: Request, res: Response): Promise<void> => {
   
     const questions = await Question.find()
     .populate('category');

      res.json(questions)

   }

  public getQuestionById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params

      const question = await Question.findById(id)
        .populate("category", "name color")
        .populate("createdBy", "name email")

      if (!question) {
        res.status(404).json({
          success: false,
          message: "Question not found",
        })
        return
      }

      res.status(200).json({
        success: true,
        data: { question },
      })
    } catch (error: any) {
      Logger.error("Get question by ID error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to fetch question",
      })
    }
  }

  public createQuestion = async (req: Request, res: Response): Promise<void> => {
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

      const questionData = {
        ...req.body,
        createdBy: (req as any).user.userId,
      }

      const question = new Question(questionData)
      await question.save()

      await question.populate("category", "name color")

      Logger.info(`Question created: ${question.question} by ${(req as any).user.userId}`)

      res.status(201).json({
        success: true,
        message: "Question created successfully",
        data: { question },
      })
    } catch (error: any) {
      Logger.error("Create question error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to create question",
      })
    }
  }

  public updateQuestion = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const updates = req.body

      const question = await Question.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true },
      ).populate("category", "name color")

      if (!question) {
        res.status(404).json({
          success: false,
          message: "Question not found",
        })
        return
      }

      Logger.info(`Question updated: ${question.question}`)

      res.status(200).json({
        success: true,
        message: "Question updated successfully",
        data: { question },
      })
    } catch (error: any) {
      Logger.error("Update question error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to update question",
      })
    }
  }

  public deleteQuestion = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params

      const question = await Question.findByIdAndDelete(id)
      if (!question) {
        res.status(404).json({
          success: false,
          message: "Question not found",
        })
        return
      }

      Logger.info(`Question deleted: ${question.question}`)

      res.status(200).json({
        success: true,
        message: "Question deleted successfully",
      })
    } catch (error: any) {
      Logger.error("Delete question error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to delete question",
      })
    }
  }

  public bulkCreateQuestions = async (req: Request, res: Response): Promise<void> => {
    try {
      const { questions } = req.body

      if (!Array.isArray(questions) || questions.length === 0) {
        res.status(400).json({
          success: false,
          message: "Questions array is required",
        })
        return
      }

      // Add createdBy to all questions
      const questionsWithCreator = questions.map((q) => ({
        ...q,
        createdBy: (req as any).user.userId,
      }))

      const createdQuestions = await Question.insertMany(questionsWithCreator)

      Logger.info(`Bulk created ${createdQuestions.length} questions`)

      res.status(201).json({
        success: true,
        message: `${createdQuestions.length} questions created successfully`,
        data: { questions: createdQuestions },
      })
    } catch (error: any) {
      Logger.error("Bulk create questions error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to create questions",
      })
    }
  }

  public getQuestionStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const [totalQuestions, questionsByDifficulty, questionsByType, questionsByCategory] = await Promise.all([
        Question.countDocuments({ isActive: true }),
        Question.aggregate([{ $match: { isActive: true } }, { $group: { _id: "$difficulty", count: { $sum: 1 } } }]),
        Question.aggregate([{ $match: { isActive: true } }, { $group: { _id: "$type", count: { $sum: 1 } } }]),
        Question.aggregate([
          { $match: { isActive: true } },
          {
            $lookup: {
              from: "categories",
              localField: "category",
              foreignField: "_id",
              as: "categoryInfo",
            },
          },
          { $unwind: "$categoryInfo" },
          {
            $group: {
              _id: "$category",
              name: { $first: "$categoryInfo.name" },
              count: { $sum: 1 },
            },
          },
        ]),
      ])

      const stats = {
        total: totalQuestions,
        byDifficulty: questionsByDifficulty,
        byType: questionsByType,
        byCategory: questionsByCategory,
      }

      res.status(200).json({
        success: true,
        data: stats,
      })
    } catch (error: any) {
      Logger.error("Get question stats error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to fetch question statistics",
      })
    }
  }
}

export default new QuestionController()