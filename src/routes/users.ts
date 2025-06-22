/**
 * User Routes
 *
 * Handles all user management endpoints:
 * - User CRUD operations
 * - User search and filtering
 * - Role management
 * - User statistics
 * - Bulk operations
 */

import { Router } from "express"
import { body } from "express-validator"
import { UserController } from "../controllers/user.controller"
import { authenticateToken, requireRole } from "../middleware/auth.middleware"

const router = Router()
const userController = new UserController()

// Validation rules
const createUserValidation = [
  body("name").trim().isLength({ min: 2, max: 100 }).withMessage("Name must be between 2 and 100 characters"),
  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain at least one lowercase letter, one uppercase letter, and one number"),
  body("role").isIn(["admin", "instructor", "student"]).withMessage("Invalid role"),
]

const updateUserValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("email").optional().isEmail().normalizeEmail().withMessage("Please provide a valid email"),
  body("role").optional().isIn(["admin", "instructor", "student"]).withMessage("Invalid role"),
]

// All routes require authentication
router.use(authenticateToken)

// Routes
router.get("/", requireRole(["admin"]), userController.getAllUsers)
router.get("/stats", requireRole(["admin"]), userController.getUserStats)
router.get("/:id", requireRole(["admin", "instructor"]), userController.getUserById)
router.post("/", requireRole(["admin"]), createUserValidation, userController.createUser)
router.put("/:id", requireRole(["admin"]), updateUserValidation, userController.updateUser)
router.delete("/:id", requireRole(["admin"]), userController.deleteUser)
router.patch("/:id/toggle-status", requireRole(["admin"]), userController.toggleUserStatus)

export default router
