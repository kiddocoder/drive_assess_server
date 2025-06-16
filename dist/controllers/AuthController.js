"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const express_validator_1 = require("express-validator");
const User_1 = require("../models/User");
const EmailService_1 = require("../services/EmailService");
const Logger_1 = require("../src/utils/Logger");
class AuthController {
    constructor() {
        this.register = async (req, res) => {
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
                const { name, email, password, role = "student", phone, location } = req.body;
                const existingUser = await User_1.User.findOne({ email });
                if (existingUser) {
                    res.status(409).json({
                        success: false,
                        message: "User already exists with this email",
                    });
                    return;
                }
                const user = new User_1.User({
                    name,
                    email,
                    password,
                    role,
                    phone,
                    location,
                });
                await user.save();
                const token = this.generateToken(user._id.toString(), user.role);
                await this.emailService.sendVerificationEmail(user.email, user.name, token);
                Logger_1.Logger.info(`New user registered: ${email} (${role})`);
                res.status(201).json({
                    success: true,
                    message: "User registered successfully. Please check your email for verification.",
                    data: {
                        user: {
                            id: user._id,
                            name: user.name,
                            email: user.email,
                            role: user.role,
                            isEmailVerified: user.isEmailVerified,
                        },
                        token,
                    },
                });
            }
            catch (error) {
                Logger_1.Logger.error("Registration error:", error);
                res.status(500).json({
                    success: false,
                    message: "Internal server error during registration",
                });
            }
        };
        this.login = async (req, res) => {
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
                const { email, password } = req.body;
                const user = await User_1.User.findOne({ email }).select("+password");
                if (!user) {
                    res.status(401).json({
                        success: false,
                        message: "Invalid email or password",
                    });
                    return;
                }
                if (user.isLocked()) {
                    res.status(423).json({
                        success: false,
                        message: "Account is temporarily locked due to too many failed login attempts",
                    });
                    return;
                }
                if (!user.isActive) {
                    res.status(403).json({
                        success: false,
                        message: "Account is deactivated. Please contact support.",
                    });
                    return;
                }
                const isPasswordValid = await user.comparePassword(password);
                if (!isPasswordValid) {
                    await user.incrementLoginAttempts();
                    res.status(401).json({
                        success: false,
                        message: "Invalid email or password",
                    });
                    return;
                }
                if (user.loginAttempts > 0) {
                    await user.resetLoginAttempts();
                }
                user.lastLogin = new Date();
                await user.save();
                const token = this.generateToken(user._id.toString(), user.role);
                Logger_1.Logger.info(`User logged in: ${email} (${user.role})`);
                res.status(200).json({
                    success: true,
                    message: "Login successful",
                    data: {
                        user: {
                            id: user._id,
                            name: user.name,
                            email: user.email,
                            role: user.role,
                            isEmailVerified: user.isEmailVerified,
                            lastLogin: user.lastLogin,
                            subscription: user.subscription,
                        },
                        token,
                    },
                });
            }
            catch (error) {
                Logger_1.Logger.error("Login error:", error);
                res.status(500).json({
                    success: false,
                    message: "Internal server error during login",
                });
            }
        };
        this.verifyEmail = async (req, res) => {
            try {
                const { token } = req.params;
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                const user = await User_1.User.findById(decoded.userId);
                if (!user) {
                    res.status(404).json({
                        success: false,
                        message: "User not found",
                    });
                    return;
                }
                if (user.isEmailVerified) {
                    res.status(400).json({
                        success: false,
                        message: "Email is already verified",
                    });
                    return;
                }
                user.isEmailVerified = true;
                await user.save();
                Logger_1.Logger.info(`Email verified for user: ${user.email}`);
                res.status(200).json({
                    success: true,
                    message: "Email verified successfully",
                });
            }
            catch (error) {
                Logger_1.Logger.error("Email verification error:", error);
                res.status(400).json({
                    success: false,
                    message: "Invalid or expired verification token",
                });
            }
        };
        this.forgotPassword = async (req, res) => {
            try {
                const { email } = req.body;
                const user = await User_1.User.findOne({ email });
                if (!user) {
                    res.status(200).json({
                        success: true,
                        message: "If the email exists, a password reset link has been sent",
                    });
                    return;
                }
                const resetToken = this.generateToken(user._id.toString(), user.role, "1h");
                await this.emailService.sendPasswordResetEmail(user.email, user.name, resetToken);
                Logger_1.Logger.info(`Password reset requested for: ${email}`);
                res.status(200).json({
                    success: true,
                    message: "If the email exists, a password reset link has been sent",
                });
            }
            catch (error) {
                Logger_1.Logger.error("Forgot password error:", error);
                res.status(500).json({
                    success: false,
                    message: "Internal server error",
                });
            }
        };
        this.resetPassword = async (req, res) => {
            try {
                const { token } = req.params;
                const { password } = req.body;
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                const user = await User_1.User.findById(decoded.userId);
                if (!user) {
                    res.status(404).json({
                        success: false,
                        message: "User not found",
                    });
                    return;
                }
                user.password = password;
                await user.save();
                Logger_1.Logger.info(`Password reset completed for: ${user.email}`);
                res.status(200).json({
                    success: true,
                    message: "Password reset successfully",
                });
            }
            catch (error) {
                Logger_1.Logger.error("Reset password error:", error);
                res.status(400).json({
                    success: false,
                    message: "Invalid or expired reset token",
                });
            }
        };
        this.getProfile = async (req, res) => {
            try {
                const userId = req.user.userId;
                const user = await User_1.User.findById(userId);
                if (!user) {
                    res.status(404).json({
                        success: false,
                        message: "User not found",
                    });
                    return;
                }
                res.status(200).json({
                    success: true,
                    data: { user },
                });
            }
            catch (error) {
                Logger_1.Logger.error("Get profile error:", error);
                res.status(500).json({
                    success: false,
                    message: "Internal server error",
                });
            }
        };
        this.updateProfile = async (req, res) => {
            try {
                const userId = req.user.userId;
                const updates = req.body;
                delete updates.password;
                delete updates.email;
                delete updates.role;
                delete updates.isEmailVerified;
                delete updates.loginAttempts;
                delete updates.lockUntil;
                const user = await User_1.User.findByIdAndUpdate(userId, { $set: updates }, { new: true, runValidators: true });
                if (!user) {
                    res.status(404).json({
                        success: false,
                        message: "User not found",
                    });
                    return;
                }
                Logger_1.Logger.info(`Profile updated for user: ${user.email}`);
                res.status(200).json({
                    success: true,
                    message: "Profile updated successfully",
                    data: { user },
                });
            }
            catch (error) {
                Logger_1.Logger.error("Update profile error:", error);
                res.status(500).json({
                    success: false,
                    message: "Internal server error",
                });
            }
        };
        this.emailService = new EmailService_1.EmailService();
    }
    generateToken(userId, role, expiresIn = "7d") {
        return jsonwebtoken_1.default.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn });
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=AuthController.js.map