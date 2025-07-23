
import mongoose, { type Document, Schema } from "mongoose"

export interface ISubscription extends Document {
  user: mongoose.Types.ObjectId
  // Subscription status can be pending, active, draft, completed, failed, refunded, or cancelled
  status: "pending" | "active" | "draft" | "completed" | "failed" | "refunded" | "cancelled"
  plan: "free" | "3-day" | "4-day" | "premium" | "single-test"
  startDate: Date
  endDate?: Date
  autoRenew: boolean
  cancelledAt?: Date
  cancelReason?: string
  isActive: boolean
}

export const subscriptionSchema = new Schema<ISubscription>({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
    default: null,
  },
  autoRenew: {
    type: Boolean,
    default: true,
  },
  cancelledAt: {
    type: Date,
    default: null,
  },
  cancelReason: {
    type: String,
    trim: true,
    default: null,
  },
  // Subscription status can be pending, active, draft, completed, failed, refunded, or cancelled
  status: {
    type: String,
    enum: ["pending", "active", "draft", "completed", "failed", "refunded", "cancelled"],
    default: "pending",
  },
  plan: {
    type: String,
    enum: ["free", "3-day", "4-day", "premium", "single-test"],
    default: "free",
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: {
    type: Date,
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
},{
  timestamps: true,
  collection: "subscriptions"
})

export const Subscription = mongoose.model<ISubscription>("Subscription", subscriptionSchema)