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
exports.Test = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const testSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: [true, "Test title is required"],
        trim: true,
        maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
        type: String,
        required: [true, "Test description is required"],
        trim: true,
        maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    category: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Category",
        required: [true, "Test category is required"],
    },
    instructor: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Instructor is required"],
    },
    questions: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "Question",
        },
    ],
    difficulty: {
        type: String,
        enum: ["easy", "normal", "hard"],
        required: [true, "Difficulty level is required"],
    },
    timeLimit: {
        type: Number,
        required: [true, "Time limit is required"],
        min: [1, "Time limit must be at least 1 minute"],
        max: [300, "Time limit cannot exceed 300 minutes"],
    },
    passingScore: {
        type: Number,
        required: [true, "Passing score is required"],
        min: [0, "Passing score cannot be negative"],
        max: [100, "Passing score cannot exceed 100%"],
        default: 70,
    },
    maxAttempts: {
        type: Number,
        default: 3,
        min: [1, "Must allow at least 1 attempt"],
        max: [10, "Cannot exceed 10 attempts"],
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    isPublished: {
        type: Boolean,
        default: false,
    },
    settings: {
        shuffleQuestions: {
            type: Boolean,
            default: true,
        },
        shuffleAnswers: {
            type: Boolean,
            default: true,
        },
        showResults: {
            type: Boolean,
            default: true,
        },
        allowReview: {
            type: Boolean,
            default: false,
        },
        requireProctoring: {
            type: Boolean,
            default: false,
        },
    },
    tags: [
        {
            type: String,
            trim: true,
            lowercase: true,
        },
    ],
    completions: {
        type: Number,
        default: 0,
        min: [0, "Completions cannot be negative"],
    },
    averageScore: {
        type: Number,
        default: 0,
        min: [0, "Average score cannot be negative"],
        max: [100, "Average score cannot exceed 100"],
    },
    passRate: {
        type: Number,
        default: 0,
        min: [0, "Pass rate cannot be negative"],
        max: [100, "Pass rate cannot exceed 100"],
    },
}, {
    timestamps: true,
});
testSchema.index({ category: 1 });
testSchema.index({ instructor: 1 });
testSchema.index({ difficulty: 1 });
testSchema.index({ isActive: 1, isPublished: 1 });
testSchema.index({ tags: 1 });
testSchema.virtual("questionCount").get(function () {
    return this.questions.length;
});
exports.Test = mongoose_1.default.model("Test", testSchema);
