"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const express_validator_1 = require("express-validator");
const User_1 = require("../models/User");
const Result_1 = require("../models/Result");
const Payment_1 = require("../models/Payment");
const Logger_1 = require("../utils/Logger");
class UserController {
    constructor() {
        this.getAllUsers = async (req, res) => {
            try {
                const { page = 1, limit = 10, role, search, sortBy = "createdAt", sortOrder = "desc", isActive } = req.query;
                const filter = {};
                if (role)
                    filter.role = role;
                if (search) {
                    filter.$or = [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }];
                }
                if (isActive !== undefined)
                    filter.isActive = isActive === "true";
                const sort = {};
                sort[sortBy] = sortOrder === "desc" ? -1 : 1;
                const skip = (Number(page) - 1) * Number(limit);
                const [users, total] = await Promise.all([
                    User_1.User.find(filter).sort(sort).skip(skip).limit(Number(limit)).select("-password"),
                    User_1.User.countDocuments(filter),
                ]);
                res.status(200).json({
                    success: true,
                    data: {
                        users,
                        pagination: {
                            current: Number(page),
                            pages: Math.ceil(total / Number(limit)),
                            total,
                            limit: Number(limit),
                        },
                    },
                });
            }
            catch (error) {
                Logger_1.Logger.error("Get all users error:", error);
                res.status(500).json({
                    success: false,
                    message: "Failed to fetch users",
                });
            }
        };
        this.getUserById = async (req, res) => {
            try {
                const { id } = req.params;
                const user = await User_1.User.findById(id).select("-password");
                if (!user) {
                    res.status(404).json({
                        success: false,
                        message: "User not found",
                    });
                    return;
                }
                const [testResults, payments] = await Promise.all([
                    Result_1.Result.find({ student: id }).populate("test", "title"),
                    Payment_1.Payment.find({ user: id }),
                ]);
                const stats = {
                    testsCompleted: testResults.filter((r) => r.status === "completed").length,
                    averageScore: testResults.length > 0 ? testResults.reduce((sum, r) => sum + r.percentage, 0) / testResults.length : 0,
                    totalSpent: payments.filter((p) => p.status === "completed").reduce((sum, p) => sum + p.amount, 0),
                    lastActivity: user.lastLogin,
                };
                res.status(200).json({
                    success: true,
                    data: {
                        user,
                        stats,
                        recentResults: testResults.slice(0, 5),
                        recentPayments: payments.slice(0, 5),
                    },
                });
            }
            catch (error) {
                Logger_1.Logger.error("Get user by ID error:", error);
                res.status(500).json({
                    success: false,
                    message: "Failed to fetch user",
                });
            }
        };
        this.createUser = async (req, res) => {
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
                const userData = req.body;
                const existingUser = await User_1.User.findOne({ email: userData.email });
                if (existingUser) {
                    res.status(409).json({
                        success: false,
                        message: "User already exists with this email",
                    });
                    return;
                }
                const user = new User_1.User(userData);
                await user.save();
                Logger_1.Logger.info(`User created: ${user.email} by admin`);
                res.status(201).json({
                    success: true,
                    message: "User created successfully",
                    data: { user },
                });
            }
            catch (error) {
                Logger_1.Logger.error("Create user error:", error);
                res.status(500).json({
                    success: false,
                    message: "Failed to create user",
                });
            }
        };
        this.updateUser = async (req, res) => {
            try {
                const { id } = req.params;
                const updates = req.body;
                delete updates.password;
                delete updates.loginAttempts;
                delete updates.lockUntil;
                const user = await User_1.User.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true }).select("-password");
                if (!user) {
                    res.status(404).json({
                        success: false,
                        message: "User not found",
                    });
                    return;
                }
                Logger_1.Logger.info(`User updated: ${user.email}`);
                res.status(200).json({
                    success: true,
                    message: "User updated successfully",
                    data: { user },
                });
            }
            catch (error) {
                Logger_1.Logger.error("Update user error:", error);
                res.status(500).json({
                    success: false,
                    message: "Failed to update user",
                });
            }
        };
        this.deleteUser = async (req, res) => {
            try {
                const { id } = req.params;
                const user = await User_1.User.findByIdAndDelete(id);
                if (!user) {
                    res.status(404).json({
                        success: false,
                        message: "User not found",
                    });
                    return;
                }
                Logger_1.Logger.info(`User deleted: ${user.email}`);
                res.status(200).json({
                    success: true,
                    message: "User deleted successfully",
                });
            }
            catch (error) {
                Logger_1.Logger.error("Delete user error:", error);
                res.status(500).json({
                    success: false,
                    message: "Failed to delete user",
                });
            }
        };
        this.toggleUserStatus = async (req, res) => {
            try {
                const { id } = req.params;
                const user = await User_1.User.findById(id);
                if (!user) {
                    res.status(404).json({
                        success: false,
                        message: "User not found",
                    });
                    return;
                }
                user.isActive = !user.isActive;
                await user.save();
                Logger_1.Logger.info(`User status toggled: ${user.email} - ${user.isActive ? "activated" : "deactivated"}`);
                res.status(200).json({
                    success: true,
                    message: `User ${user.isActive ? "activated" : "deactivated"} successfully`,
                    data: { user },
                });
            }
            catch (error) {
                Logger_1.Logger.error("Toggle user status error:", error);
                res.status(500).json({
                    success: false,
                    message: "Failed to toggle user status",
                });
            }
        };
        this.getUserStats = async (req, res) => {
            try {
                const [totalUsers, activeUsers, studentsCount, instructorsCount, recentUsers] = await Promise.all([
                    User_1.User.countDocuments(),
                    User_1.User.countDocuments({ isActive: true }),
                    User_1.User.countDocuments({ role: "student" }),
                    User_1.User.countDocuments({ role: "instructor" }),
                    User_1.User.find().sort({ createdAt: -1 }).limit(10).select("name email role createdAt"),
                ]);
                const stats = {
                    total: totalUsers,
                    active: activeUsers,
                    students: studentsCount,
                    instructors: instructorsCount,
                    admins: totalUsers - studentsCount - instructorsCount,
                    recent: recentUsers,
                };
                res.status(200).json({
                    success: true,
                    data: stats,
                });
            }
            catch (error) {
                Logger_1.Logger.error("Get user stats error:", error);
                res.status(500).json({
                    success: false,
                    message: "Failed to fetch user statistics",
                });
            }
        };
    }
}
exports.UserController = UserController;
exports.default = new UserController();
