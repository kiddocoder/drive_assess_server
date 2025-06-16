"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const auth_1 = require("../middleware/auth");
const Logger_1 = require("../utils/Logger");
const router = (0, express_1.Router)();
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + "-" + uniqueSuffix + path_1.default.extname(file.originalname));
    },
});
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/") ||
        file.mimetype === "application/pdf" ||
        file.mimetype === "text/csv" ||
        file.mimetype === "application/vnd.ms-excel") {
        cb(null, true);
    }
    else {
        cb(new Error("Invalid file type"), false);
    }
};
const upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
});
router.use(auth_1.authenticateToken);
router.post("/image", upload.single("image"), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded",
            });
        }
        Logger_1.Logger.info(`Image uploaded: ${req.file.filename}`);
        res.status(200).json({
            success: true,
            message: "Image uploaded successfully",
            data: {
                filename: req.file.filename,
                originalName: req.file.originalname,
                size: req.file.size,
                url: `/uploads/${req.file.filename}`,
            },
        });
    }
    catch (error) {
        Logger_1.Logger.error("Image upload error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to upload image",
        });
    }
});
router.post("/images", upload.array("images", 5), (req, res) => {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No files uploaded",
            });
        }
        const uploadedFiles = files.map((file) => ({
            filename: file.filename,
            originalName: file.originalname,
            size: file.size,
            url: `/uploads/${file.filename}`,
        }));
        Logger_1.Logger.info(`Multiple images uploaded: ${files.length} files`);
        res.status(200).json({
            success: true,
            message: "Images uploaded successfully",
            data: { files: uploadedFiles },
        });
    }
    catch (error) {
        Logger_1.Logger.error("Multiple image upload error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to upload images",
        });
    }
});
router.post("/questions-csv", (0, auth_1.requireRole)(["admin", "instructor"]), upload.single("csv"), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No CSV file uploaded",
            });
        }
        Logger_1.Logger.info(`Questions CSV uploaded: ${req.file.filename}`);
        res.status(200).json({
            success: true,
            message: "CSV file uploaded successfully. Questions will be processed.",
            data: {
                filename: req.file.filename,
                originalName: req.file.originalname,
                size: req.file.size,
            },
        });
    }
    catch (error) {
        Logger_1.Logger.error("CSV upload error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to upload CSV file",
        });
    }
});
exports.default = router;
