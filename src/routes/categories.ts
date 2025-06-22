
/**
 * Category Routes
 *
 * Handles all category management endpoints:
 * - Category CRUD operations
 * - Hierarchical category structure
 * - Category statistics
 */

import { Router } from "express"
import { body } from "express-validator"
import { CategoryController } from "../controllers/category.controller"
import { authenticateToken, requireRole } from "../middleware/auth.middleware"

const router = Router()
const categoryController = new CategoryController()

// Validation rules
const createCategoryValidation = [
  body("name").trim().isLength({ min: 2, max: 100 }).withMessage("Name must be between 2 and 100 characters"),
  body("description").optional().trim().isLength({ max: 500 }).withMessage("Description cannot exceed 500 characters"),
  body("slug")
    .optional()
    .matches(/^[a-z0-9-]+$/)
    .withMessage("Slug can only contain lowercase letters, numbers, and hyphens"),
  body("parent").optional().isMongoId().withMessage("Parent must be a valid category ID"),
  body("color")
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage("Color must be a valid hex color"),
]

const updateCategoryValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("description").optional().trim().isLength({ max: 500 }).withMessage("Description cannot exceed 500 characters"),
  body("color")
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage("Color must be a valid hex color"),
]

// All routes require authentication
router.use(authenticateToken)

// Routes
router.get("/", categoryController.getAllCategories)
router.get("/tree", categoryController.getCategoryTree)
router.get("/:id", categoryController.getCategoryById)
router.post("/", requireRole(["admin", "instructor"]), createCategoryValidation, categoryController.createCategory)
router.put("/:id", requireRole(["admin", "instructor"]), updateCategoryValidation, categoryController.updateCategory)
router.delete("/:id", requireRole(["admin"]), categoryController.deleteCategory)

export default router
