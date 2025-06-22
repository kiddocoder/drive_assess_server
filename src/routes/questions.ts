/**
 * Question Routes
 *
 * Handles all question management endpoints:
 * - Question CRUD operations
 * - Question categorization
 * - Bulk import/export
 * - Question analytics
 */

import { Router } from "express"
import { body } from "express-validator"
import { QuestionController } from "../controllers/question.controller"
import { authenticateToken, requireRole } from "../middleware/auth.middleware"

const router = Router()
const questionController = new QuestionController()

// Validation rules
const createQuestionValidation = [
  body("title").trim().isLength({ min: 3, max: 200 }).withMessage("Title must be between 3 and 200 characters"),
  body("content").trim().isLength({ min: 10, max: 2000 }).withMessage("Content must be between 10 and 2000 characters"),
  body("type").isIn(["multiple_choice", "true_false", "essay", "fill_blank"]).withMessage("Invalid question type"),
  body("category").isMongoId().withMessage("Valid category ID is required"),
  body("difficulty").isIn(["easy", "normal", "hard"]).withMessage("Invalid difficulty level"),
  body("points").isInt({ min: 1, max: 10 }).withMessage("Points must be between 1 and 10"),
]

const updateQuestionValidation = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage("Title must be between 3 and 200 characters"),
  body("content")
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage("Content must be between 10 and 2000 characters"),
  body("type")
    .optional()
    .isIn(["multiple_choice", "true_false", "essay", "fill_blank"])
    .withMessage("Invalid question type"),
  body("difficulty").optional().isIn(["easy", "normal", "hard"]).withMessage("Invalid difficulty level"),
  body("points").optional().isInt({ min: 1, max: 10 }).withMessage("Points must be between 1 and 10"),
]

// All routes require authentication
router.use(authenticateToken)

// Routes
router.get("/", questionController.getAllQuestions)
router.get("/stats", requireRole(["admin", "instructor"]), questionController.getQuestionStats)
router.get("/:id", questionController.getQuestionById)
router.post("/", requireRole(["admin", "instructor"]), createQuestionValidation, questionController.createQuestion)
router.post("/bulk", requireRole(["admin", "instructor"]), questionController.bulkCreateQuestions)
router.put("/:id", requireRole(["admin", "instructor"]), updateQuestionValidation, questionController.updateQuestion)
router.delete("/:id", requireRole(["admin", "instructor"]), questionController.deleteQuestion)

export default router
