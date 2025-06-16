"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const AuthController_1 = require("../../controllers/AuthController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const authController = new AuthController_1.AuthController();
const registerValidation = [
    (0, express_validator_1.body)("name").trim().isLength({ min: 2, max: 100 }).withMessage("Name must be between 2 and 100 characters"),
    (0, express_validator_1.body)("email").isEmail().normalizeEmail().withMessage("Please provide a valid email"),
    (0, express_validator_1.body)("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters")
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage("Password must contain at least one lowercase letter, one uppercase letter, and one number"),
    (0, express_validator_1.body)("role").optional().isIn(["admin", "instructor", "student"]).withMessage("Invalid role"),
    (0, express_validator_1.body)("phone").optional().isMobilePhone("any").withMessage("Please provide a valid phone number"),
];
const loginValidation = [
    (0, express_validator_1.body)("email").isEmail().normalizeEmail().withMessage("Please provide a valid email"),
    (0, express_validator_1.body)("password").notEmpty().withMessage("Password is required"),
];
const forgotPasswordValidation = [(0, express_validator_1.body)("email").isEmail().normalizeEmail().withMessage("Please provide a valid email")];
const resetPasswordValidation = [
    (0, express_validator_1.body)("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters")
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage("Password must contain at least one lowercase letter, one uppercase letter, and one number"),
];
router.post("/register", registerValidation, authController.register);
router.post("/login", loginValidation, authController.login);
router.get("/verify-email/:token", authController.verifyEmail);
router.post("/forgot-password", forgotPasswordValidation, authController.forgotPassword);
router.post("/reset-password/:token", resetPasswordValidation, authController.resetPassword);
router.get("/profile", auth_1.authenticateToken, authController.getProfile);
router.put("/profile", auth_1.authenticateToken, authController.updateProfile);
exports.default = router;
//# sourceMappingURL=auth.js.map