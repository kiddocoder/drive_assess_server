/**
 * Payment Routes
 *
 * Handles all payment-related endpoints:
 * - Payment processing
 * - Subscription management
 * - Refund processing
 * - Payment analytics
 */

import { Router } from "express"
import { body } from "express-validator"
import { PaymentController } from "../controllers/payment.controller"
import { authenticateToken, requireRole } from "../middleware/auth.middleware"

const router = Router()
const paymentController = new PaymentController()

// Validation rules
const createPaymentValidation = [
  body("type").isIn(["subscription", "test_purchase", "certificate"]).withMessage("Invalid payment type"),
  body("plan").isIn(["3-day", "4-day", "premium", "single-test"]).withMessage("Invalid plan"),
  body("amount").isFloat({ min: 0 }).withMessage("Amount must be a positive number"),
  body("paymentMethod").isIn(["stripe", "paypal", "apple_pay", "google_pay"]).withMessage("Invalid payment method"),
]

// All routes require authentication
router.use(authenticateToken)

// Routes
router.get("/", requireRole(["admin"]), paymentController.getAllPayments)
router.get("/stats", requireRole(["admin"]), paymentController.getPaymentStats)
router.get("/:id", paymentController.getPaymentById)
router.post("/", createPaymentValidation, paymentController.createPayment)
router.patch("/:id/status", requireRole(["admin"]), paymentController.updatePaymentStatus)
router.post("/:id/refund", requireRole(["admin"]), paymentController.processRefund)

export default router
