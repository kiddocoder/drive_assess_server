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
exports.Question = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const questionSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: [true, "Question title is required"],
        trim: true,
        maxlength: [200, "Title cannot exceed 200 characters"],
    },
    content: {
        type: String,
        required: [true, "Question content is required"],
        trim: true,
        maxlength: [2000, "Content cannot exceed 2000 characters"],
    },
    type: {
        type: String,
        enum: ["multiple_choice", "true_false", "essay", "fill_blank"],
        required: [true, "Question type is required"],
    },
    category: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Category",
        required: [true, "Category is required"],
    },
    difficulty: {
        type: String,
        enum: ["easy", "normal", "hard"],
        required: [true, "Difficulty is required"],
    },
    options: [
        {
            text: {
                type: String,
                required: true,
                trim: true,
                maxlength: [500, "Option text cannot exceed 500 characters"],
            },
            isCorrect: {
                type: Boolean,
                required: true,
            },
            explanation: {
                type: String,
                trim: true,
                maxlength: [1000, "Explanation cannot exceed 1000 characters"],
            },
        },
    ],
    correctAnswer: {
        type: String,
        trim: true,
    },
    explanation: {
        type: String,
        trim: true,
        maxlength: [1000, "Explanation cannot exceed 1000 characters"],
    },
    points: {
        type: Number,
        required: [true, "Points are required"],
        min: [1, "Points must be at least 1"],
        max: [10, "Points cannot exceed 10"],
        default: 1,
    },
    timeLimit: {
        type: Number,
        min: [10, "Time limit must be at least 10 seconds"],
        max: [600, "Time limit cannot exceed 10 minutes"],
    },
    media: [
        {
            type: {
                type: String,
                enum: ["image", "video", "audio"],
                required: true,
            },
            url: {
                type: String,
                required: true,
            },
            alt: {
                type: String,
                trim: true,
            },
        },
    ],
    tags: [
        {
            type: String,
            trim: true,
            lowercase: true,
        },
    ],
    isActive: {
        type: Boolean,
        default: true,
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Creator is required"],
    },
    usageCount: {
        type: Number,
        default: 0,
        min: [0, "Usage count cannot be negative"],
    },
    correctRate: {
        type: Number,
        default: 0,
        min: [0, "Correct rate cannot be negative"],
        max: [100, "Correct rate cannot exceed 100"],
    },
    averageTime: {
        type: Number,
        default: 0,
        min: [0, "Average time cannot be negative"],
    },
}, {
    timestamps: true,
});
questionSchema.index({ category: 1 });
questionSchema.index({ difficulty: 1 });
questionSchema.index({ type: 1 });
questionSchema.index({ createdBy: 1 });
questionSchema.index({ tags: 1 });
questionSchema.index({ isActive: 1 });
exports.Question = mongoose_1.default.model("Question", questionSchema);
//# sourceMappingURL=Question.js.map