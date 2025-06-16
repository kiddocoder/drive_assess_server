"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const QuestionController_1 = require("../controllers/QuestionController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const questionController = new QuestionController_1.QuestionController();
const createQuestionValidation = [
    (0, express_validator_1.body)("title").trim().isLength({ min: 3, max: 200 }).withMessage("Title must be between 3 and 200 characters"),
    (0, express_validator_1.body)("content").trim().isLength({ min: 10, max: 2000 }).withMessage("Content must be between 10 and 2000 characters"),
    (0, express_validator_1.body)("type").isIn(["multiple_choice", "true_false", "essay", "fill_blank"]).withMessage("Invalid question type"),
    (0, express_validator_1.body)("category").isMongoId().withMessage("Valid category ID is required"),
    (0, express_validator_1.body)("difficulty").isIn(["easy", "normal", "hard"]).withMessage("Invalid difficulty level"),
    (0, express_validator_1.body)("points").isInt({ min: 1, max: 10 }).withMessage("Points must be between 1 and 10"),
];
const updateQuestionValidation = [
    (0, express_validator_1.body)("title")
        .optional()
        .trim()
        .isLength({ min: 3, max: 200 })
        .withMessage("Title must be between 3 and 200 characters"),
    (0, express_validator_1.body)("content")
        .optional()
        .trim()
        .isLength({ min: 10, max: 2000 })
        .withMessage("Content must be between 10 and 2000 characters"),
    (0, express_validator_1.body)("type")
        .optional()
        .isIn(["multiple_choice", "true_false", "essay", "fill_blank"])
        .withMessage("Invalid question type"),
    (0, express_validator_1.body)("difficulty").optional().isIn(["easy", "normal", "hard"]).withMessage("Invalid difficulty level"),
    (0, express_validator_1.body)("points").optional().isInt({ min: 1, max: 10 }).withMessage("Points must be between 1 and 10"),
];
router.use(auth_1.authenticateToken);
router.get("/", questionController.getAllQuestions);
router.get("/stats", (0, auth_1.requireRole)(["admin", "instructor"]), questionController.getQuestionStats);
router.get("/:id", questionController.getQuestionById);
router.post("/", (0, auth_1.requireRole)(["admin", "instructor"]), createQuestionValidation, questionController.createQuestion);
router.post("/bulk", (0, auth_1.requireRole)(["admin", "instructor"]), questionController.bulkCreateQuestions);
router.put("/:id", (0, auth_1.requireRole)(["admin", "instructor"]), updateQuestionValidation, questionController.updateQuestion);
router.delete("/:id", (0, auth_1.requireRole)(["admin", "instructor"]), questionController.deleteQuestion);
exports.default = router;
//# sourceMappingURL=questions.js.map