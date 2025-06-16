"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const TestController_1 = require("../controllers/TestController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const testController = new TestController_1.TestController();
const createTestValidation = [
    (0, express_validator_1.body)("title").trim().isLength({ min: 3, max: 200 }).withMessage("Title must be between 3 and 200 characters"),
    (0, express_validator_1.body)("description")
        .trim()
        .isLength({ min: 10, max: 1000 })
        .withMessage("Description must be between 10 and 1000 characters"),
    (0, express_validator_1.body)("category").isMongoId().withMessage("Valid category ID is required"),
    (0, express_validator_1.body)("difficulty").isIn(["easy", "normal", "hard"]).withMessage("Invalid difficulty level"),
    (0, express_validator_1.body)("timeLimit").isInt({ min: 1, max: 300 }).withMessage("Time limit must be between 1 and 300 minutes"),
    (0, express_validator_1.body)("passingScore").isInt({ min: 0, max: 100 }).withMessage("Passing score must be between 0 and 100"),
];
const updateTestValidation = [
    (0, express_validator_1.body)("title")
        .optional()
        .trim()
        .isLength({ min: 3, max: 200 })
        .withMessage("Title must be between 3 and 200 characters"),
    (0, express_validator_1.body)("description")
        .optional()
        .trim()
        .isLength({ min: 10, max: 1000 })
        .withMessage("Description must be between 10 and 1000 characters"),
    (0, express_validator_1.body)("difficulty").optional().isIn(["easy", "normal", "hard"]).withMessage("Invalid difficulty level"),
    (0, express_validator_1.body)("timeLimit").optional().isInt({ min: 1, max: 300 }).withMessage("Time limit must be between 1 and 300 minutes"),
    (0, express_validator_1.body)("passingScore").optional().isInt({ min: 0, max: 100 }).withMessage("Passing score must be between 0 and 100"),
];
router.use(auth_1.authenticateToken);
router.get("/", testController.getAllTests);
router.get("/:id", testController.getTestById);
router.post("/", (0, auth_1.requireRole)(["admin", "instructor"]), createTestValidation, testController.createTest);
router.put("/:id", (0, auth_1.requireRole)(["admin", "instructor"]), updateTestValidation, testController.updateTest);
router.delete("/:id", (0, auth_1.requireRole)(["admin", "instructor"]), testController.deleteTest);
router.patch("/:id/publish", (0, auth_1.requireRole)(["admin", "instructor"]), testController.publishTest);
router.post("/:testId/questions/:questionId", (0, auth_1.requireRole)(["admin", "instructor"]), testController.addQuestionToTest);
router.delete("/:testId/questions/:questionId", (0, auth_1.requireRole)(["admin", "instructor"]), testController.removeQuestionFromTest);
exports.default = router;
