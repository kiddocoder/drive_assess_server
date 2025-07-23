/**
 * Payment Controller
 *
 * Handles payment processing and subscription management:
 * - Payment creation and processing
 * - Subscription management
 * - Refund processing
 * - Payment analytics
 * - Webhook handling
 */

import type { Request, Response } from "express"
import { validationResult } from "express-validator"
import { IPayment, Payment } from "../models/payments/Payment"
import { User } from "../models/users/User"
import { Logger } from "../utils/Logger"
import { Types } from "mongoose"
import { Subscription, subscriptionSchema } from "../models/users/Subscription"
import { Metadata } from "../models/payments/Metadata"
import Stripe from "stripe";

const stripe = new Stripe(String(process.env.STRIPE_SECRET_KEY));

export class PaymentController {
  public getAllPayments = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page = 1, limit = 10, status, type, user, sortBy = "createdAt", sortOrder = "desc" } = req.query

      // Build filter object
      const filter: any = {}
      if (status) filter.status = status
      if (type) filter.type = type
      if (user) filter.user = user

      // Build sort object
      const sort: any = {}
      sort[sortBy as string] = sortOrder === "desc" ? -1 : 1

      const skip = (Number(page) - 1) * Number(limit)

      const [payments, total] = await Promise.all([
        Payment.find(filter).populate("user", "name email").sort(sort).skip(skip).limit(Number(limit)),
        Payment.countDocuments(filter),
      ])

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
      })
    } catch (error: any) {
      Logger.error("Get all payments error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to fetch payments",
      })
    }
  }

  public getPaymentById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params

      const payment = await Payment.findById(id).populate("user", "name email")

      if (!payment) {
        res.status(404).json({
          success: false,
          message: "Payment not found",
        })
        return
      }

      res.status(200).json({
        success: true,
        data: { payment },
      })
    } catch (error: any) {
      Logger.error("Get payment by ID error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to fetch payment",
      })
    }
  }

  public createPayment = async (req: Request, res: Response): Promise<void> => {
    try {
       const userId = (req as any).user.userId;
       
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
        return
      }

      const metadatas = {
        ...req.body.metadata,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      }

      const metadata = await new Metadata(metadatas).save()

      const user = await User.findById(userId)

      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found",
        })
        return
      }

      const paymentData = {
        ...req.body,
        user: user._id,
        metadata: metadata._id
      }

      const payment = await new Payment(paymentData).save()

      if (!payment) {
        res.status(500).json({
          success: false,
          message: "Failed to create payment",
        })
        return
      }
  
      // Update user subscription if payment is for subscription
      if (payment.type === "subscription" && payment.status === "completed") {
        // create subscription
        const subscription =  await Subscription.create({
          user: user._id,
          status:'active',
          plan: req.body.plan,
          startDate: new Date(),
        });
        
        payment.subscription = subscription?._id as Types.ObjectId;

        await this.updateUserSubscription(user._id as Types.ObjectId, payment,payment.subscription?._id,)
      }

      await payment.populate("user", "name email")

      Logger.info(`Payment created: ${payment._id} for user ${payment.user}`)

      res.status(201).json({
        success: true,
        message: "Payment created successfully",
        data: { payment },
      })
    } catch (error: any) {
      Logger.error("Create payment error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to create payment",
      })
    }
  }

  public updatePaymentStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const { status, transactionId } = req.body

      const payment = await Payment.findById(id)
      if (!payment) {
        res.status(404).json({
          success: false,
          message: "Payment not found",
        })
        return
      }

      payment.status = status
      if (transactionId) payment.transactionId = transactionId
      const savedPayment = await payment.save()

      // Update user subscription if payment is completed
      if (payment.type === "subscription" && status === "completed") {
        await this.updateUserSubscription( savedPayment.user, savedPayment,savedPayment.subscription?._id,)
      }

      Logger.info(`Payment status updated: ${payment._id} - ${status}`)

      res.status(200).json({
        success: true,
        message: "Payment status updated successfully",
        data: { savedPayment },
      })
    } catch (error: any) {
      Logger.error("Update payment status error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to update payment status",
      })
    }
  }

  public processRefund = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const { reason } = req.body

      const originalPayment = await Payment.findById(id)
      if (!originalPayment) {
        res.status(404).json({
          success: false,
          message: "Payment not found",
        })
        return
      }

      if (originalPayment.status !== "completed") {
        res.status(400).json({
          success: false,
          message: "Can only refund completed payments",
        })
        return
      }

      // Create refund payment record
      const refundPayment = new Payment({
        user: originalPayment.user,
        type: "refund",
        amount: -originalPayment.amount,
        currency: originalPayment.currency,
        status: "completed",
        paymentMethod: originalPayment.paymentMethod,
        transactionId: `refund_${originalPayment.transactionId}`,
        metadata: {
          originalPaymentId: originalPayment._id,
          refundReason: reason,
        },
      })

      await refundPayment.save()

      // Update original payment status
      originalPayment.status = "refunded"
      await originalPayment.save()

      // Update user subscription if needed
      if (originalPayment.type === "subscription") {
        await this.cancelUserSubscription(originalPayment.user, reason,originalPayment.subscription?._id,)
      }

      Logger.info(`Refund processed: ${refundPayment._id} for payment ${originalPayment._id}`)

      res.status(200).json({
        success: true,
        message: "Refund processed successfully",
        data: { refund: refundPayment },
      })
    } catch (error: any) {
      Logger.error("Process refund error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to process refund",
      })
    }
  }

  public getPaymentStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const [totalRevenue, monthlyRevenue, paymentsByStatus, paymentsByPlan, recentPayments] = await Promise.all([
        Payment.aggregate([
          { $match: { status: "completed", type: { $ne: "refund" } } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        Payment.aggregate([
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
        Payment.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
        Payment.aggregate([
          { $match: { status: "completed", type: { $ne: "refund" } } },
          { $group: { _id: "$plan", count: { $sum: 1 }, revenue: { $sum: "$amount" } } },
        ]),
        Payment.find({ status: "completed" }).populate("user", "name email").sort({ createdAt: -1 }).limit(10),
      ])

      const stats = {
        totalRevenue: totalRevenue[0]?.total || 0,
        monthlyRevenue: monthlyRevenue[0]?.total || 0,
        paymentsByStatus,
        paymentsByPlan,
        recentPayments,
      }

      res.status(200).json({
        success: true,
        data: stats,
      })
    } catch (error: any) {
      Logger.error("Get payment stats error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to fetch payment statistics",
      })
    }
  }

  private async updateUserSubscription( userId: Types.ObjectId, payment: IPayment,subscriptionId?: Types.ObjectId): Promise<void> {
    try {
      const user = await User.findById(payment.user)
        // find subscriptions for that user 
      const subscription = await Subscription.findOne(subscriptionId)

      if(!subscription) return

      if (!user) return

      const subscriptionDays = this.getSubscriptionDays(subscription.plan)
      const startDate = new Date()
      const endDate = new Date(startDate.getTime() + subscriptionDays * 24 * 60 * 60 * 1000)

    
      if (subscription) {
        subscription.startDate = startDate
        subscription.endDate = endDate
        subscription.isActive = true
        await subscription.save()
      } else {
        await Subscription.create({
          user: userId,
          startDate,
          endDate,
          isActive: true,
        })
      }

      Logger.info(`User subscription updated: ${user.email} - ${subscription.plan}`)
    } catch (error: any) {
      Logger.error("Update user subscription error:", error)
    }
  }

  private async cancelUserSubscription(userId: Types.ObjectId, reason: string,subcriptionId?: Types.ObjectId,): Promise<void> {
    try {
      const subscription = await Subscription.findOne({ _id: subcriptionId, isActive: true ,user: userId })

      const user = await User.findById(userId)

      if (!user) return
  
      if (!subscription) return

      subscription.isActive = false
      await subscription.save()

      Logger.info(`User subscription cancelled: ${user.email} - ${reason}`)
    } catch (error: any) {
      Logger.error("Cancel user subscription error:", error)
    }
  }

  private getSubscriptionDays(plan: string): number {
    switch (plan) {
      case "3-day":
        return 3
      case "4-day":
        return 4
      case "premium":
        return 365 // 1 year
      default:
        return 0
    }
  }


  public createPaymentIntent = async (req: Request, res: Response) => {
  try {
    const { amount, currency } = req.body;
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        integration_check: "accept_a_payment",
      },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error:any) {
    res.status(500).json({ error: error.message });
  }
};

 public getPayouts = async (req: Request, res: Response) => {
 try {
    const payouts = await stripe.payouts.list();

    res.status(200).json({ payouts: payouts.data });
  } catch (error:any) {
    res.status(400).json({ error: error.message });
  }

 }

 public withdraw = async (req: Request, res: Response) => {
  const { amount } = req.body; // in cents (e.g., $10 = 1000 cents)

  try {
    const payout = await stripe.payouts.create({
      amount: amount * 100, // Convert dollars to cents
      currency: "usd",
      method: "standard", // or "instant" (for faster, but higher fee)
    });

    res.status(200).json({ success: true, payout });
  } catch (error:any) {
    res.status(400).json({ success: false, error: error.message });
  }

 }

  public getStripeBalance = async () => {
  try {
    const balance = await stripe.balance.retrieve();
    return balance as any;
  } catch (error) {
    console.error("Error fetching balance:", error);
  }
 }

}

export default new PaymentController()