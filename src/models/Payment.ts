/**
 * Payment Model
 *
 * Handles payment transactions and subscriptions:
 * - Payment processing records
 * - Subscription management
 * - Transaction history
 * - Refund tracking
 */

import mongoose, { type Document, Schema } from "mongoose"

export interface IPayment extends Document {
  user: mongoose.Types.ObjectId
  type: "subscription" | "test_purchase" | "certificate" | "refund"
  plan: "3-day" | "4-day" | "premium" | "single-test"
  amount: number
  currency: string
  status: "pending" | "completed" | "failed" | "refunded" | "cancelled"
  paymentMethod: "stripe" | "paypal" | "apple_pay" | "google_pay"
  transactionId?: string
  stripePaymentIntentId?: string
  subscription?: {
    startDate: Date
    endDate: Date
    isActive: boolean
    autoRenew: boolean
    cancelledAt?: Date
    cancelReason?: string
  }
  metadata: {
    ipAddress?: string
    userAgent?: string
    couponCode?: string
    discount?: number
  }
  createdAt: Date
  updatedAt: Date
}

const paymentSchema = new Schema<IPayment>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    type: {
      type: String,
      enum: ["subscription", "test_purchase", "certificate", "refund"],
      required: [true, "Payment type is required"],
    },
    plan: {
      type: String,
      enum: ["3-day", "4-day", "premium", "single-test"],
      required: [true, "Plan is required"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    currency: {
      type: String,
      required: [true, "Currency is required"],
      default: "CAD",
      uppercase: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded", "cancelled"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["stripe", "paypal", "apple_pay", "google_pay"],
      required: [true, "Payment method is required"],
    },
    transactionId: {
      type: String,
      trim: true,
    },
    stripePaymentIntentId: {
      type: String,
      trim: true,
    },
    subscription: {
      startDate: {
        type: Date,
        required: function () {
          return this.type === "subscription"
        },
      },
      endDate: {
        type: Date,
        required: function () {
          return this.type === "subscription"
        },
      },
      isActive: {
        type: Boolean,
        default: true,
      },
      autoRenew: {
        type: Boolean,
        default: false,
      },
      cancelledAt: {
        type: Date,
      },
      cancelReason: {
        type: String,
        trim: true,
      },
    },
    metadata: {
      ipAddress: {
        type: String,
        trim: true,
      },
      userAgent: {
        type: String,
        trim: true,
      },
      couponCode: {
        type: String,
        trim: true,
        uppercase: true,
      },
      discount: {
        type: Number,
        min: [0, "Discount cannot be negative"],
        max: [100, "Discount cannot exceed 100%"],
      },
    },
  },
  {
    timestamps: true,
  },
)

// Indexes for performance
paymentSchema.index({ user: 1 })
paymentSchema.index({ status: 1 })
paymentSchema.index({ type: 1 })
paymentSchema.index({ transactionId: 1 })
paymentSchema.index({ createdAt: -1 })

export const Payment = mongoose.model<IPayment>("Payment", paymentSchema)
