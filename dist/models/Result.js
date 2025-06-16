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
exports.Result = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const resultSchema = new mongoose_1.Schema({
    student: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Student is required"],
    },
    test: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Test",
        required: [true, "Test is required"],
    },
    attempt: {
        type: Number,
        required: [true, "Attempt number is required"],
        min: [1, "Attempt must be at least 1"],
    },
    status: {
        type: String,
        enum: ["in_progress", "completed", "abandoned", "expired"],
        default: "in_progress",
    },
    startedAt: {
        type: Date,
        required: [true, "Start time is required"],
        default: Date.now,
    },
    completedAt: {
        type: Date,
    },
    timeSpent: {
        type: Number,
        default: 0,
        min: [0, "Time spent cannot be negative"],
    },
    score: {
        type: Number,
        default: 0,
        min: [0, "Score cannot be negative"],
    },
    percentage: {
        type: Number,
        default: 0,
        min: [0, "Percentage cannot be negative"],
        max: [100, "Percentage cannot exceed 100"],
    },
    passed: {
        type: Boolean,
        default: false,
    },
    answers: [
        {
            question: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: "Question",
                required: true,
            },
            selectedAnswer: {
                type: String,
                trim: true,
            },
            selectedOptions: [
                {
                    type: String,
                    trim: true,
                },
            ],
            isCorrect: {
                type: Boolean,
                required: true,
            },
            points: {
                type: Number,
                required: true,
                min: [0, "Points cannot be negative"],
            },
            timeSpent: {
                type: Number,
                required: true,
                min: [0, "Time spent cannot be negative"],
            },
        },
    ],
    feedback: {
        type: String,
        trim: true,
        maxlength: [2000, "Feedback cannot exceed 2000 characters"],
    },
    certificate: {
        issued: {
            type: Boolean,
            default: false,
        },
        certificateId: {
            type: String,
            trim: true,
        },
        issuedAt: {
            type: Date,
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
        browserInfo: {
            type: mongoose_1.Schema.Types.Mixed,
        },
        cheatingFlags: [
            {
                type: String,
                trim: true,
            },
        ],
    },
}, {
    timestamps: true,
});
resultSchema.index({ student: 1, test: 1 });
resultSchema.index({ test: 1 });
resultSchema.index({ status: 1 });
resultSchema.index({ completedAt: -1 });
resultSchema.index({ percentage: -1 });
resultSchema.index({ student: 1, test: 1, attempt: 1 }, { unique: true });
exports.Result = mongoose_1.default.model("Result", resultSchema);
