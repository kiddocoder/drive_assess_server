/**
 * Question Model
 *
 * Defines the question schema for tests/quizzes:
 * - Multiple question types (multiple choice, true/false, essay)
 * - Answer options and correct answers
 * - Difficulty levels and categories
 * - Media attachments (images, videos)
 * - Question analytics and usage tracking
 */

import mongoose, { type Document, Schema } from "mongoose"

export interface IQuestion extends Document {
  title: string
  content: string
  type: "multiple_choice" | "true_false" | "essay" | "fill_blank"
  category: mongoose.Types.ObjectId
  difficulty: "easy" | "normal" | "hard"
  options?: {
    text: string
    isCorrect: boolean
    explanation?: string
  }[]
  correctAnswer?: string
  explanation?: string
  points: number
  timeLimit?: number // in seconds
  media?: {
    type: "image" | "video" | "audio"
    url: string
    alt?: string
  }[]
  tags: string[]
  isActive: boolean
  createdBy: mongoose.Types.ObjectId
  usageCount: number
  correctRate: number
  averageTime: number
  createdAt: Date
  updatedAt: Date
}

const questionSchema = new Schema<IQuestion>(
  {
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
      type: Schema.Types.ObjectId,
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
      type: Schema.Types.ObjectId,
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
  },
  {
    timestamps: true,
  },
)

// Indexes for performance
questionSchema.index({ category: 1 })
questionSchema.index({ difficulty: 1 })
questionSchema.index({ type: 1 })
questionSchema.index({ createdBy: 1 })
questionSchema.index({ tags: 1 })
questionSchema.index({ isActive: 1 })

export const Question = mongoose.model<IQuestion>("Question", questionSchema)
