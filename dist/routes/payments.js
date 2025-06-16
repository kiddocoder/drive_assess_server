"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const PaymentController_1 = require("../controllers/PaymentController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const paymentController = new PaymentController_1.PaymentController();
const createPaymentValidation = [
    (0, express_validator_1.body)("type").isIn(["subscription", "test_purchase", "certificate"]).withMessage("Invalid payment type"),
    (0, express_validator_1.body)("plan").isIn(["3-day", "4-day", "premium", "single-test"]).withMessage("Invalid plan"),
    (0, express_validator_1.body)("amount").isFloat({ min: 0 }).withMessage("Amount must be a positive number"),
    (0, express_validator_1.body)("paymentMethod").isIn(["stripe", "paypal", "apple_pay", "google_pay"]).withMessage("Invalid payment method"),
];
router.use(auth_1.authenticateToken);
router.get("/", (0, auth_1.requireRole)(["admin"]), paymentController.getAllPayments);
router.get("/stats", (0, auth_1.requireRole)(["admin"]), paymentController.getPaymentStats);
router.get("/:id", paymentController.getPaymentById);
router.post("/", createPaymentValidation, paymentController.createPayment);
router.patch("/:id/status", (0, auth_1.requireRole)(["admin"]), paymentController.updatePaymentStatus);
router.post("/:id/refund", (0, auth_1.requireRole)(["admin"]), paymentController.processRefund);
exports.default = router;
//# sourceMappingURL=payments.js.map