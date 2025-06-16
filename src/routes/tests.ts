/**
 * Test Routes
 *
 * Handles all test management endpoints:
 * - Test CRUD operations
 * - Test publishing and scheduling
 * - Question management
 * - Test analytics
 * - Bulk operations
 */

import { Router } from "express"
import { body } from "express-validator"
import { TestController } from "../controllers/TestController"
import { authenticateToken, requireRole } from "../middleware/auth"

const router = Router()
const testController = new TestController()

// Validation rules
const createTestValidation = [
  body("title").trim().isLength({ min: 3, max: 200 }).withMessage("Title must be between 3 and 200 characters"),
  body("description")
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Description must be between 10 and 1000 characters"),
  body("category").isMongoId().withMessage("Valid category ID is required"),
  body("difficulty").isIn(["easy", "normal", "hard"]).withMessage("Invalid difficulty level"),
  body("timeLimit").isInt({ min: 1, max: 300 }).withMessage("Time limit must be between 1 and 300 minutes"),
  body("passingScore").isInt({ min: 0, max: 100 }).withMessage("Passing score must be between 0 and 100"),
]

const updateTestValidation = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage("Title must be between 3 and 200 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Description must be between 10 and 1000 characters"),
  body("difficulty").optional().isIn(["easy", "normal", "hard"]).withMessage("Invalid difficulty level"),
  body("timeLimit").optional().isInt({ min: 1, max: 300 }).withMessage("Time limit must be between 1 and 300 minutes"),
  body("passingScore").optional().isInt({ min: 0, max: 100 }).withMessage("Passing score must be between 0 and 100"),
]

// All routes require authentication
router.use(authenticateToken)

// Routes
router.get("/", testController.getAllTests)
router.get("/:id", testController.getTestById)
router.post("/", requireRole(["admin", "instructor"]), createTestValidation, testController.createTest)
router.put("/:id", requireRole(["admin", "instructor"]), updateTestValidation, testController.updateTest)
router.delete("/:id", requireRole(["admin", "instructor"]), testController.deleteTest)
router.patch("/:id/publish", requireRole(["admin", "instructor"]), testController.publishTest)
router.post("/:testId/questions/:questionId", requireRole(["admin", "instructor"]), testController.addQuestionToTest)
router.delete(
  "/:testId/questions/:questionId",
  requireRole(["admin", "instructor"]),
  testController.removeQuestionFromTest,
)

export default router
