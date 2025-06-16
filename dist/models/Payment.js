"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Payment = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const paymentSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
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
                return this.type === "subscription";
            },
        },
        endDate: {
            type: Date,
            required: function () {
                return this.type === "subscription";
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
}, {
    timestamps: true,
});
paymentSchema.index({ user: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ type: 1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ createdAt: -1 });
exports.Payment = mongoose_1.default.model("Payment", paymentSchema);
//# sourceMappingURL=Payment.js.map