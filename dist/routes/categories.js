"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const CategoryController_1 = require("../controllers/CategoryController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const categoryController = new CategoryController_1.CategoryController();
const createCategoryValidation = [
    (0, express_validator_1.body)("name").trim().isLength({ min: 2, max: 100 }).withMessage("Name must be between 2 and 100 characters"),
    (0, express_validator_1.body)("description").optional().trim().isLength({ max: 500 }).withMessage("Description cannot exceed 500 characters"),
    (0, express_validator_1.body)("slug")
        .optional()
        .matches(/^[a-z0-9-]+$/)
        .withMessage("Slug can only contain lowercase letters, numbers, and hyphens"),
    (0, express_validator_1.body)("parent").optional().isMongoId().withMessage("Parent must be a valid category ID"),
    (0, express_validator_1.body)("color")
        .optional()
        .matches(/^#[0-9A-F]{6}$/i)
        .withMessage("Color must be a valid hex color"),
];
const updateCategoryValidation = [
    (0, express_validator_1.body)("name")
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage("Name must be between 2 and 100 characters"),
    (0, express_validator_1.body)("description").optional().trim().isLength({ max: 500 }).withMessage("Description cannot exceed 500 characters"),
    (0, express_validator_1.body)("color")
        .optional()
        .matches(/^#[0-9A-F]{6}$/i)
        .withMessage("Color must be a valid hex color"),
];
router.use(auth_1.authenticateToken);
router.get("/", categoryController.getAllCategories);
router.get("/tree", categoryController.getCategoryTree);
router.get("/:id", categoryController.getCategoryById);
router.post("/", (0, auth_1.requireRole)(["admin", "instructor"]), createCategoryValidation, categoryController.createCategory);
router.put("/:id", (0, auth_1.requireRole)(["admin", "instructor"]), updateCategoryValidation, categoryController.updateCategory);
router.delete("/:id", (0, auth_1.requireRole)(["admin"]), categoryController.deleteCategory);
exports.default = router;
