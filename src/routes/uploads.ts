/**
 * Upload Routes
 *
 * Handles file upload operations:
 * - Image uploads for questions and profiles
 * - Document uploads for certificates
 * - Bulk question imports
 * - File validation and processing
 */

import { Router } from "express"
import multer from "multer"
import path from "path"
import { authenticateToken, requireRole } from "../middleware/auth"
import { Logger } from "../utils/Logger"
import type { Express } from "express" // Import Express

const router = Router()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/")
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname))
  },
})

const fileFilter = (req: any, file: any, cb: any) => {
  // Allow images and documents
  if (
    file.mimetype.startsWith("image/") ||
    file.mimetype === "application/pdf" ||
    file.mimetype === "text/csv" ||
    file.mimetype === "application/vnd.ms-excel"
  ) {
    cb(null, true)
  } else {
    cb(new Error("Invalid file type"), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
})

// All routes require authentication
router.use(authenticateToken)

// Upload single image
router.post("/image", upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      })
    }

    Logger.info(`Image uploaded: ${req.file.filename}`)

    res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        url: `/uploads/${req.file.filename}`,
      },
    })
  } catch (error: any) {
    Logger.error("Image upload error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to upload image",
    })
  }
})

// Upload multiple images
router.post("/images", upload.array("images", 5), (req, res) => {
  try {
    const files = req.files as Express.Multer.File[]

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded",
      })
    }

    const uploadedFiles = files.map((file) => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      url: `/uploads/${file.filename}`,
    }))

    Logger.info(`Multiple images uploaded: ${files.length} files`)

    res.status(200).json({
      success: true,
      message: "Images uploaded successfully",
      data: { files: uploadedFiles },
    })
  } catch (error: any) {
    Logger.error("Multiple image upload error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to upload images",
    })
  }
})

// Upload CSV for bulk question import
router.post("/questions-csv", requireRole(["admin", "instructor"]), upload.single("csv"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No CSV file uploaded",
      })
    }

    // TODO: Process CSV file and create questions
    // This would involve parsing the CSV and creating Question documents

    Logger.info(`Questions CSV uploaded: ${req.file.filename}`)

    res.status(200).json({
      success: true,
      message: "CSV file uploaded successfully. Questions will be processed.",
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
      },
    })
  } catch (error: any) {
    Logger.error("CSV upload error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to upload CSV file",
    })
  }
})

export default router
