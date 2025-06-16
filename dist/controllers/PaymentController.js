"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const express_validator_1 = require("express-validator");
const Payment_1 = require("../models/Payment");
const User_1 = require("../models/User");
const Logger_1 = require("../utils/Logger");
class PaymentController {
    constructor() {
        this.getAllPayments = async (req, res) => {
            try {
                const { page = 1, limit = 10, status, type, user, sortBy = "createdAt", sortOrder = "desc" } = req.query;
                const filter = {};
                if (status)
                    filter.status = status;
                if (type)
                    filter.type = type;
                if (user)
                    filter.user = user;
                const sort = {};
                sort[sortBy] = sortOrder === "desc" ? -1 : 1;
                const skip = (Number(page) - 1) * Number(limit);
                const [payments, total] = await Promise.all([
                    Payment_1.Payment.find(filter).populate("user", "name email").sort(sort).skip(skip).limit(Number(limit)),
                    Payment_1.Payment.countDocuments(filter),
                ]);
                res.status(200).json({
                    success: true,
                    data: {
                        payments,
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
                Logger_1.Logger.error("Get all payments error:", error);
                res.status(500).json({
                    success: false,
                    message: "Failed to fetch payments",
                });
            }
        };
        this.getPaymentById = async (req, res) => {
            try {
                const { id } = req.params;
                const payment = await Payment_1.Payment.findById(id).populate("user", "name email");
                if (!payment) {
                    res.status(404).json({
                        success: false,
                        message: "Payment not found",
                    });
                    return;
                }
                res.status(200).json({
                    success: true,
                    data: { payment },
                });
            }
            catch (error) {
                Logger_1.Logger.error("Get payment by ID error:", error);
                res.status(500).json({
                    success: false,
                    message: "Failed to fetch payment",
                });
            }
        };
        this.createPayment = async (req, res) => {
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
                const paymentData = {
                    ...req.body,
                    user: req.user.userId,
                    metadata: {
                        ...req.body.metadata,
                        ipAddress: req.ip,
                        userAgent: req.get("User-Agent"),
                    },
                };
                const payment = new Payment_1.Payment(paymentData);
                await payment.save();
                if (payment.type === "subscription" && payment.status === "completed") {
                    await this.updateUserSubscription(payment);
                }
                await payment.populate("user", "name email");
                Logger_1.Logger.info(`Payment created: ${payment._id} for user ${payment.user}`);
                res.status(201).json({
                    success: true,
                    message: "Payment created successfully",
                    data: { payment },
                });
            }
            catch (error) {
                Logger_1.Logger.error("Create payment error:", error);
                res.status(500).json({
                    success: false,
                    message: "Failed to create payment",
                });
            }
        };
        this.updatePaymentStatus = async (req, res) => {
            try {
                const { id } = req.params;
                const { status, transactionId } = req.body;
                const payment = await Payment_1.Payment.findById(id);
                if (!payment) {
                    res.status(404).json({
                        success: false,
                        message: "Payment not found",
                    });
                    return;
                }
                payment.status = status;
                if (transactionId)
                    payment.transactionId = transactionId;
                await payment.save();
                if (payment.type === "subscription" && status === "completed") {
                    await this.updateUserSubscription(payment);
                }
                Logger_1.Logger.info(`Payment status updated: ${payment._id} - ${status}`);
                res.status(200).json({
                    success: true,
                    message: "Payment status updated successfully",
                    data: { payment },
                });
            }
            catch (error) {
                Logger_1.Logger.error("Update payment status error:", error);
                res.status(500).json({
                    success: false,
                    message: "Failed to update payment status",
                });
            }
        };
        this.processRefund = async (req, res) => {
            try {
                const { id } = req.params;
                const { reason } = req.body;
                const originalPayment = await Payment_1.Payment.findById(id);
                if (!originalPayment) {
                    res.status(404).json({
                        success: false,
                        message: "Payment not found",
                    });
                    return;
                }
                if (originalPayment.status !== "completed") {
                    res.status(400).json({
                        success: false,
                        message: "Can only refund completed payments",
                    });
                    return;
                }
                const refundPayment = new Payment_1.Payment({
                    user: originalPayment.user,
                    type: "refund",
                    plan: originalPayment.plan,
                    amount: -originalPayment.amount,
                    currency: originalPayment.currency,
                    status: "completed",
                    paymentMethod: originalPayment.paymentMethod,
                    transactionId: `refund_${originalPayment.transactionId}`,
                    metadata: {
                        originalPaymentId: originalPayment._id,
                        refundReason: reason,
                    },
                });
                await refundPayment.save();
                originalPayment.status = "refunded";
                await originalPayment.save();
                if (originalPayment.type === "subscription") {
                    await this.cancelUserSubscription(originalPayment.user, reason);
                }
                Logger_1.Logger.info(`Refund processed: ${refundPayment._id} for payment ${originalPayment._id}`);
                res.status(200).json({
                    success: true,
                    message: "Refund processed successfully",
                    data: { refund: refundPayment },
                });
            }
            catch (error) {
                Logger_1.Logger.error("Process refund error:", error);
                res.status(500).json({
                    success: false,
                    message: "Failed to process refund",
                });
            }
        };
        this.getPaymentStats = async (req, res) => {
            try {
                const [totalRevenue, monthlyRevenue, paymentsByStatus, paymentsByPlan, recentPayments] = await Promise.all([
                    Payment_1.Payment.aggregate([
                        { $match: { status: "completed", type: { $ne: "refund" } } },
                        { $group: { _id: null, total: { $sum: "$amount" } } },
                    ]),
                    Payment_1.Payment.aggregate([
                        {
                            $match: {
                                status: "completed",
                                type: { $ne: "refund" },
                                createdAt: {
                                    $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                                },
                            },
                        },
                        { $group: { _id: null, total: { $sum: "$amount" } } },
                    ]),
                    Payment_1.Payment.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
                    Payment_1.Payment.aggregate([
                        { $match: { status: "completed", type: { $ne: "refund" } } },
                        { $group: { _id: "$plan", count: { $sum: 1 }, revenue: { $sum: "$amount" } } },
                    ]),
                    Payment_1.Payment.find({ status: "completed" }).populate("user", "name email").sort({ createdAt: -1 }).limit(10),
                ]);
                const stats = {
                    totalRevenue: totalRevenue[0]?.total || 0,
                    monthlyRevenue: monthlyRevenue[0]?.total || 0,
                    paymentsByStatus,
                    paymentsByPlan,
                    recentPayments,
                };
                res.status(200).json({
                    success: true,
                    data: stats,
                });
            }
            catch (error) {
                Logger_1.Logger.error("Get payment stats error:", error);
                res.status(500).json({
                    success: false,
                    message: "Failed to fetch payment statistics",
                });
            }
        };
    }
    async updateUserSubscription(payment) {
        try {
            const user = await User_1.User.findById(payment.user);
            if (!user)
                return;
            const subscriptionDays = this.getSubscriptionDays(payment.plan);
            const startDate = new Date();
            const endDate = new Date(startDate.getTime() + subscriptionDays * 24 * 60 * 60 * 1000);
            user.subscription = {
                type: payment.plan,
                startDate,
                endDate,
                isActive: true,
            };
            await user.save();
            Logger_1.Logger.info(`User subscription updated: ${user.email} - ${payment.plan}`);
        }
        catch (error) {
            Logger_1.Logger.error("Update user subscription error:", error);
        }
    }
    async cancelUserSubscription(userId, reason) {
        try {
            const user = await User_1.User.findById(userId);
            if (!user || !user.subscription)
                return;
            user.subscription.isActive = false;
            await user.save();
            Logger_1.Logger.info(`User subscription cancelled: ${user.email} - ${reason}`);
        }
        catch (error) {
            Logger_1.Logger.error("Cancel user subscription error:", error);
        }
    }
    getSubscriptionDays(plan) {
        switch (plan) {
            case "3-day":
                return 3;
            case "4-day":
                return 4;
            case "premium":
                return 365;
            default:
                return 0;
        }
    }
}
exports.PaymentController = PaymentController;
exports.default = new PaymentController();
//# sourceMappingURL=PaymentController.js.map