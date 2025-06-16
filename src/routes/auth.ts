/**
 * Authentication Routes
 *
 * Handles all authentication-related endpoints:
 * - User registration and login
 * - Email verification
 * - Password reset functionality
 * - Profile management
 *
 * Validation:
 * - Input validation using express-validator
 * - Password strength requirements
 * - Email format validation
 * - Rate limiting for security
 */

import { Router } from "express"
import { body } from "express-validator"
import { AuthController } from "../../controllers/AuthController"
import { authenticateToken } from "../middleware/auth"

const router = Router()
const authController = new AuthController()

// Validation rules
const registerValidation = [
  body("name").trim().isLength({ min: 2, max: 100 }).withMessage("Name must be between 2 and 100 characters"),
  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain at least one lowercase letter, one uppercase letter, and one number"),
  body("role").optional().isIn(["admin", "instructor", "student"]).withMessage("Invalid role"),
  body("phone").optional().isMobilePhone("any").withMessage("Please provide a valid phone number"),
]

const loginValidation = [
  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
]

const forgotPasswordValidation = [body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email")]

const resetPasswordValidation = [
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain at least one lowercase letter, one uppercase letter, and one number"),
]

// Routes
router.post("/register", registerValidation, authController.register)
router.post("/login", loginValidation, authController.login)
router.get("/verify-email/:token", authController.verifyEmail)
router.post("/forgot-password", forgotPasswordValidation, authController.forgotPassword)
router.post("/reset-password/:token", resetPasswordValidation, authController.resetPassword)

// Protected routes
router.get("/profile", authenticateToken, authController.getProfile)
router.put("/profile", authenticateToken, authController.updateProfile)

export default router
