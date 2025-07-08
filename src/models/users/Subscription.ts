
import mongoose, { type Document, Schema } from "mongoose"

export interface ISubscription extends Document {
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