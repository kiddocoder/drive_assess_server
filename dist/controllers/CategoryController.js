"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryController = void 0;
const express_validator_1 = require("express-validator");
const Category_1 = require("../models/Category");
const Test_1 = require("../models/Test");
const Question_1 = require("../models/Question");
const Logger_1 = require("../utils/Logger");
class CategoryController {
    constructor() {
        this.getAllCategories = async (req, res) => {
            try {
                const { includeInactive = false, parent } = req.query;
                const filter = {};
                if (!includeInactive)
                    filter.isActive = true;
                if (parent !== undefined) {
                    filter.parent = parent === "null" ? null : parent;
                }
                const categories = await Category_1.Category.find(filter)
                    .populate("parent", "name slug")
                    .populate("createdBy", "name email")
                    .sort({ sortOrder: 1, name: 1 });
                res.status(200).json({
                    success: true,
                    data: { categories },
                });
            }
            catch (error) {
                Logger_1.Logger.error("Get all categories error:", error);
                res.status(500).json({
                    success: false,
                    message: "Failed to fetch categories",
                });
            }
        };
        this.getCategoryById = async (req, res) => {
            try {
                const { id } = req.params;
                const category = await Category_1.Category.findById(id).populate("parent", "name slug").populate("createdBy", "name email");
                if (!category) {
                    res.status(404).json({
                        success: false,
                        message: "Category not found",
                    });
                    return;
                }
                const subcategories = await Category_1.Category.find({ parent: id, isActive: true });
                const [testCount, questionCount] = await Promise.all([
                    Test_1.Test.countDocuments({ category: id }),
                    Question_1.Question.countDocuments({ category: id }),
                ]);
                res.status(200).json({
                    success: true,
                    data: {
                        category,
                        subcategories,
                        stats: {
                            tests: testCount,
                            questions: questionCount,
                        },
                    },
                });
            }
            catch (error) {
                Logger_1.Logger.error("Get category by ID error:", error);
                res.status(500).json({
                    success: false,
                    message: "Failed to fetch category",
                });
            }
        };
        this.createCategory = async (req, res) => {
            try {
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    res.status(400).json({
                        success: false,
                        message: "Validation failed",
                        errors: errors.array(),
                    });
                    return;
                }
                const categoryData = {
                    ...req.body,
                    createdBy: req.user.userId,
                };
                if (!categoryData.slug) {
                    categoryData.slug = categoryData.name
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/^-|-$/g, "");
                }
                const category = new Category_1.Category(categoryData);
                await category.save();
                await category.populate("parent", "name slug");
                Logger_1.Logger.info(`Category created: ${category.name} by ${req.user.userId}`);
                res.status(201).json({
                    success: true,
                    message: "Category created successfully",
                    data: { category },
                });
            }
            catch (error) {
                if (error.code === 11000) {
                    res.status(409).json({
                        success: false,
                        message: "Category slug already exists",
                    });
                    return;
                }
                Logger_1.Logger.error("Create category error:", error);
                res.status(500).json({
                    success: false,
                    message: "Failed to create category",
                });
            }
        };
        this.updateCategory = async (req, res) => {
            try {
                const { id } = req.params;
                const updates = req.body;
                const category = await Category_1.Category.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true }).populate("parent", "name slug");
                if (!category) {
                    res.status(404).json({
                        success: false,
                        message: "Category not found",
                    });
                    return;
                }
                Logger_1.Logger.info(`Category updated: ${category.name}`);
                res.status(200).json({
                    success: true,
                    message: "Category updated successfully",
                    data: { category },
                });
            }
            catch (error) {
                Logger_1.Logger.error("Update category error:", error);
                res.status(500).json({
                    success: false,
                    message: "Failed to update category",
                });
            }
        };
        this.deleteCategory = async (req, res) => {
            try {
                const { id } = req.params;
                const [testCount, questionCount, subcategoryCount] = await Promise.all([
                    Test_1.Test.countDocuments({ category: id }),
                    Question_1.Question.countDocuments({ category: id }),
                    Category_1.Category.countDocuments({ parent: id }),
                ]);
                if (testCount > 0 || questionCount > 0 || subcategoryCount > 0) {
                    res.status(400).json({
                        success: false,
                        message: "Cannot delete category that contains tests, questions, or subcategories",
                    });
                    return;
                }
                const category = await Category_1.Category.findByIdAndDelete(id);
                if (!category) {
                    res.status(404).json({
                        success: false,
                        message: "Category not found",
                    });
                    return;
                }
                Logger_1.Logger.info(`Category deleted: ${category.name}`);
                res.status(200).json({
                    success: true,
                    message: "Category deleted successfully",
                });
            }
            catch (error) {
                Logger_1.Logger.error("Delete category error:", error);
                res.status(500).json({
                    success: false,
                    message: "Failed to delete category",
                });
            }
        };
        this.getCategoryTree = async (req, res) => {
            try {
                const categories = await Category_1.Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
                const categoryMap = new Map();
                const tree = [];
                categories.forEach((cat) => {
                    categoryMap.set(cat._id.toString(), {
                        ...cat.toObject(),
                        children: [],
                    });
                });
                categories.forEach((cat) => {
                    const categoryObj = categoryMap.get(cat._id.toString());
                    if (cat.parent) {
                        const parent = categoryMap.get(cat.parent.toString());
                        if (parent) {
                            parent.children.push(categoryObj);
                        }
                    }
                    else {
                        tree.push(categoryObj);
                    }
                });
                res.status(200).json({
                    success: true,
                    data: { tree },
                });
            }
            catch (error) {
                Logger_1.Logger.error("Get category tree error:", error);
                res.status(500).json({
                    success: false,
                    message: "Failed to fetch category tree",
                });
            }
        };
    }
}
exports.CategoryController = CategoryController;
//# sourceMappingURL=CategoryController.js.map