"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestController = void 0;
const express_validator_1 = require("express-validator");
const Test_1 = require("../models/Test");
const Question_1 = require("../models/Question");
const Result_1 = require("../models/Result");
const Logger_1 = require("../utils/Logger");
class TestController {
    constructor() {
        this.getAllTests = async (req, res) => {
            try {
                const { page = 1, limit = 10, category, difficulty, instructor, search, status, sortBy = "createdAt", sortOrder = "desc", } = req.query;
                const filter = {};
                if (category)
                    filter.category = category;
                if (difficulty)
                    filter.difficulty = difficulty;
                if (instructor)
                    filter.instructor = instructor;
                if (status) {
                    if (status === "published")
                        filter.isPublished = true;
                    if (status === "draft")
                        filter.isPublished = false;
                }
                if (search) {
                    filter.$or = [{ title: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }];
                }
                const sort = {};
                sort[sortBy] = sortOrder === "desc" ? -1 : 1;
                const skip = (Number(page) - 1) * Number(limit);
                const [tests, total] = await Promise.all([
                    Test_1.Test.find(filter)
                        .populate("category", "name color")
                        .populate("instructor", "name email")
                        .sort(sort)
                        .skip(skip)
                        .limit(Number(limit)),
                    Test_1.Test.countDocuments(filter),
                ]);
                res.status(200).json({
                    success: true,
                    data: {
                        tests,
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
                Logger_1.Logger.error("Get all tests error:", error);
                res.status(500).json({
                    success: false,
                    message: "Failed to fetch tests",
                });
            }
        };
        this.getTestById = async (req, res) => {
            try {
                const { id } = req.params;
                const test = await Test_1.Test.findById(id)
                    .populate("category", "name color")
                    .populate("instructor", "name email")
                    .populate("questions");
                if (!test) {
                    res.status(404).json({
                        success: false,
                        message: "Test not found",
                    });
                    return;
                }
                const results = await Result_1.Result.find({ test: id });
                const stats = {
                    totalAttempts: results.length,
                    completedAttempts: results.filter((r) => r.status === "completed").length,
                    averageScore: results.length > 0 ? results.reduce((sum, r) => sum + r.percentage, 0) / results.length : 0,
                    passRate: results.length > 0 ? (results.filter((r) => r.passed).length / results.length) * 100 : 0,
                };
                res.status(200).json({
                    success: true,
                    data: {
                        test,
                        stats,
                    },
                });
            }
            catch (error) {
                Logger_1.Logger.error("Get test by ID error:", error);
                res.status(500).json({
                    success: false,
                    message: "Failed to fetch test",
                });
            }
        };
        this.createTest = async (req, res) => {
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
                const testData = {
                    ...req.body,
                    instructor: req.user.userId,
                };
                const test = new Test_1.Test(testData);
                await test.save();
                await test.populate("category", "name color");
                Logger_1.Logger.info(`Test created: ${test.title} by ${req.user.userId}`);
                res.status(201).json({
                    success: true,
                    message: "Test created successfully",
                    data: { test },
                });
            }
            catch (error) {
                Logger_1.Logger.error("Create test error:", error);
                res.status(500).json({
                    success: false,
                    message: "Failed to create test",
                });
            }
        };
        this.updateTest = async (req, res) => {
            try {
                const { id } = req.params;
                const updates = req.body;
                const test = await Test_1.Test.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true }).populate("category", "name color");
                if (!test) {
                    res.status(404).json({
                        success: false,
                        message: "Test not found",
                    });
                    return;
                }
                Logger_1.Logger.info(`Test updated: ${test.title}`);
                res.status(200).json({
                    success: true,
                    message: "Test updated successfully",
                    data: { test },
                });
            }
            catch (error) {
                Logger_1.Logger.error("Update test error:", error);
                res.status(500).json({
                    success: false,
                    message: "Failed to update test",
                });
            }
        };
        this.deleteTest = async (req, res) => {
            try {
                const { id } = req.params;
                const test = await Test_1.Test.findByIdAndDelete(id);
                if (!test) {
                    res.status(404).json({
                        success: false,
                        message: "Test not found",
                    });
                    return;
                }
                await Result_1.Result.deleteMany({ test: id });
                Logger_1.Logger.info(`Test deleted: ${test.title}`);
                res.status(200).json({
                    success: true,
                    message: "Test deleted successfully",
                });
            }
            catch (error) {
                Logger_1.Logger.error("Delete test error:", error);
                res.status(500).json({
                    success: false,
                    message: "Failed to delete test",
                });
            }
        };
        this.publishTest = async (req, res) => {
            try {
                const { id } = req.params;
                const test = await Test_1.Test.findById(id);
                if (!test) {
                    res.status(404).json({
                        success: false,
                        message: "Test not found",
                    });
                    return;
                }
                if (test.questions.length === 0) {
                    res.status(400).json({
                        success: false,
                        message: "Cannot publish test without questions",
                    });
                    return;
                }
                test.isPublished = !test.isPublished;
                await test.save();
                Logger_1.Logger.info(`Test ${test.isPublished ? "published" : "unpublished"}: ${test.title}`);
                res.status(200).json({
                    success: true,
                    message: `Test ${test.isPublished ? "published" : "unpublished"} successfully`,
                    data: { test },
                });
            }
            catch (error) {
                Logger_1.Logger.error("Publish test error:", error);
                res.status(500).json({
                    success: false,
                    message: "Failed to publish test",
                });
            }
        };
        this.addQuestionToTest = async (req, res) => {
            try {
                const { testId, questionId } = req.params;
                const [test, question] = await Promise.all([Test_1.Test.findById(testId), Question_1.Question.findById(questionId)]);
                if (!test) {
                    res.status(404).json({
                        success: false,
                        message: "Test not found",
                    });
                    return;
                }
                if (!question) {
                    res.status(404).json({
                        success: false,
                        message: "Question not found",
                    });
                    return;
                }
                if (test.questions.includes(question._id)) {
                    res.status(400).json({
                        success: false,
                        message: "Question already added to test",
                    });
                    return;
                }
                test.questions.push(question._id);
                await test.save();
                res.status(200).json({
                    success: true,
                    message: "Question added to test successfully",
                    data: { test },
                });
            }
            catch (error) {
                Logger_1.Logger.error("Add question to test error:", error);
                res.status(500).json({
                    success: false,
                    message: "Failed to add question to test",
                });
            }
        };
        this.removeQuestionFromTest = async (req, res) => {
            try {
                const { testId, questionId } = req.params;
                const test = await Test_1.Test.findById(testId);
                if (!test) {
                    res.status(404).json({
                        success: false,
                        message: "Test not found",
                    });
                    return;
                }
                test.questions = test.questions.filter((q) => q.toString() !== questionId);
                await test.save();
                res.status(200).json({
                    success: true,
                    message: "Question removed from test successfully",
                    data: { test },
                });
            }
            catch (error) {
                Logger_1.Logger.error("Remove question from test error:", error);
                res.status(500).json({
                    success: false,
                    message: "Failed to remove question from test",
                });
            }
        };
    }
}
exports.TestController = TestController;
exports.default = new TestsController();
//# sourceMappingURL=TestsController.js.map