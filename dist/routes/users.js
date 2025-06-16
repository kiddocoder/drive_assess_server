"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const UserController_1 = require("../controllers/UserController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const userController = new UserController_1.UserController();
const createUserValidation = [
    (0, express_validator_1.body)("name").trim().isLength({ min: 2, max: 100 }).withMessage("Name must be between 2 and 100 characters"),
    (0, express_validator_1.body)("email").isEmail().normalizeEmail().withMessage("Please provide a valid email"),
    (0, express_validator_1.body)("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters")
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage("Password must contain at least one lowercase letter, one uppercase letter, and one number"),
    (0, express_validator_1.body)("role").isIn(["admin", "instructor", "student"]).withMessage("Invalid role"),
];
const updateUserValidation = [
    (0, express_validator_1.body)("name")
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage("Name must be between 2 and 100 characters"),
    (0, express_validator_1.body)("email").optional().isEmail().normalizeEmail().withMessage("Please provide a valid email"),
    (0, express_validator_1.body)("role").optional().isIn(["admin", "instructor", "student"]).withMessage("Invalid role"),
];
router.use(auth_1.authenticateToken);
router.get("/", (0, auth_1.requireRole)(["admin"]), userController.getAllUsers);
router.get("/stats", (0, auth_1.requireRole)(["admin"]), userController.getUserStats);
router.get("/:id", (0, auth_1.requireRole)(["admin", "instructor"]), userController.getUserById);
router.post("/", (0, auth_1.requireRole)(["admin"]), createUserValidation, userController.createUser);
router.put("/:id", (0, auth_1.requireRole)(["admin"]), updateUserValidation, userController.updateUser);
router.delete("/:id", (0, auth_1.requireRole)(["admin"]), userController.deleteUser);
router.patch("/:id/toggle-status", (0, auth_1.requireRole)(["admin"]), userController.toggleUserStatus);
exports.default = router;
