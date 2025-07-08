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
  amount: number
  currency: string
  status: "pending" | "completed" | "failed" | "refunded" | "cancelled"
  paymentMethod: "stripe" | "paypal" | "apple_pay" | "google_pay"
  transactionId?: string
  stripePaymentIntentId?: string
  subscription?: mongoose.Types.ObjectId | null
  metadata: {
    ipAddress?: string
    userAgent?: string
    couponCode?: string
    discount?: number
  }
  createdAt: Date
  updatedAt: Date
}

export const paymentSchema = new Schema<IPayment>(
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
      default: null,
      trim: true,
    },
    stripePaymentIntentId: {
      type: String,
      trim: true,
    },
    subscription: {
     type: Schema.Types.ObjectId,
      ref: "Subscription",
      default: null,
    },
    metadata: {
      type:mongoose.Schema.Types.ObjectId,
      ref:"Metadata",
      default: null
    }
  },
  {
    timestamps: true,
    collection: "payments",
  },
)

// Indexes for performance
paymentSchema.index({ user: 1 })
paymentSchema.index({ status: 1 })
paymentSchema.index({ type: 1 })
paymentSchema.index({ transactionId: 1 })
paymentSchema.index({ createdAt: -1 })

export const Payment = mongoose.model<IPayment>("Payment", paymentSchema)
