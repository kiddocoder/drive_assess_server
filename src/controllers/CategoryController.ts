/**
 * Category Controller
 *
 * Handles category management:
 * - Category CRUD operations
 * - Hierarchical category structure
 * - Category statistics
 * - Bulk operations
 */

import type { Request, Response } from "express"
import { validationResult } from "express-validator"
import { Category } from "../models/Category"
import { Test } from "../models/Test"
import { Question } from "../models/Question"
import { Logger } from "../utils/Logger"

export class CategoryController {
  public getAllCategories = async (req: Request, res: Response): Promise<void> => {
    try {
      const { includeInactive = false, parent } = req.query

      const filter: any = {}
      if (!includeInactive) filter.isActive = true
      if (parent !== undefined) {
        filter.parent = parent === "null" ? null : parent
      }

      const categories = await Category.find(filter)
        .populate("parent", "name slug")
        .populate("createdBy", "name email")
        .sort({ sortOrder: 1, name: 1 })

      res.status(200).json({
        success: true,
        data: { categories },
      })
    } catch (error: any) {
      Logger.error("Get all categories error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to fetch categories",
      })
    }
  }

  public getCategoryById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params

      const category = await Category.findById(id).populate("parent", "name slug").populate("createdBy", "name email")

      if (!category) {
        res.status(404).json({
          success: false,
          message: "Category not found",
        })
        return
      }

      // Get subcategories
      const subcategories = await Category.find({ parent: id, isActive: true })

      // Get category statistics
      const [testCount, questionCount] = await Promise.all([
        Test.countDocuments({ category: id }),
        Question.countDocuments({ category: id }),
      ])

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
      })
    } catch (error: any) {
      Logger.error("Get category by ID error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to fetch category",
      })
    }
  }

  public createCategory = async (req: Request, res: Response): Promise<void> => {
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

      const categoryData = {
        ...req.body,
        createdBy: (req as any).user.userId,
      }

      // Generate slug if not provided
      if (!categoryData.slug) {
        categoryData.slug = categoryData.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
      }

      const category = new Category(categoryData)
      await category.save()

      await category.populate("parent", "name slug")

      Logger.info(`Category created: ${category.name} by ${(req as any).user.userId}`)

      res.status(201).json({
        success: true,
        message: "Category created successfully",
        data: { category },
      })
    } catch (error: any) {
      if (error.code === 11000) {
        res.status(409).json({
          success: false,
          message: "Category slug already exists",
        })
        return
      }

      Logger.error("Create category error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to create category",
      })
    }
  }

  public updateCategory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const updates = req.body

      const category = await Category.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true },
      ).populate("parent", "name slug")

      if (!category) {
        res.status(404).json({
          success: false,
          message: "Category not found",
        })
        return
      }

      Logger.info(`Category updated: ${category.name}`)

      res.status(200).json({
        success: true,
        message: "Category updated successfully",
        data: { category },
      })
    } catch (error: any) {
      Logger.error("Update category error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to update category",
      })
    }
  }

  public deleteCategory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params

      // Check if category has tests or questions
      const [testCount, questionCount, subcategoryCount] = await Promise.all([
        Test.countDocuments({ category: id }),
        Question.countDocuments({ category: id }),
        Category.countDocuments({ parent: id }),
      ])

      if (testCount > 0 || questionCount > 0 || subcategoryCount > 0) {
        res.status(400).json({
          success: false,
          message: "Cannot delete category that contains tests, questions, or subcategories",
        })
        return
      }

      const category = await Category.findByIdAndDelete(id)
      if (!category) {
        res.status(404).json({
          success: false,
          message: "Category not found",
        })
        return
      }

      Logger.info(`Category deleted: ${category.name}`)

      res.status(200).json({
        success: true,
        message: "Category deleted successfully",
      })
    } catch (error: any) {
      Logger.error("Delete category error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to delete category",
      })
    }
  }

  public getCategoryTree = async (req: Request, res: Response): Promise<void> => {
    try {
      const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 })

      // Build tree structure
      const categoryMap = new Map()
      const tree: any[] = []

      // First pass: create map of all categories
      categories.forEach((cat) => {
        categoryMap.set(cat._id.toString(), {
          ...cat.toObject(),
          children: [],
        })
      })

      // Second pass: build tree structure
      categories.forEach((cat) => {
        const categoryObj = categoryMap.get(cat._id.toString())
        if (cat.parent) {
          const parent = categoryMap.get(cat.parent.toString())
          if (parent) {
            parent.children.push(categoryObj)
          }
        } else {
          tree.push(categoryObj)
        }
      })

      res.status(200).json({
        success: true,
        data: { tree },
      })
    } catch (error: any) {
      Logger.error("Get category tree error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to fetch category tree",
      })
    }
  }
}
