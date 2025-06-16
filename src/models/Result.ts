/**
 * Result Model
 *
 * Stores test results and student performance:
 * - Test completion data
 * - Scoring and timing information
 * - Answer tracking
 * - Performance analytics
 */

import mongoose, { type Document, Schema } from "mongoose"

export interface IResult extends Document {
  student: mongoose.Types.ObjectId
  test: mongoose.Types.ObjectId
  attempt: number
  status: "in_progress" | "completed" | "abandoned" | "expired"
  startedAt: Date
  completedAt?: Date
  timeSpent: number // in seconds
  score: number
  percentage: number
  passed: boolean
  answers: {
    question: mongoose.Types.ObjectId
    selectedAnswer?: string
    selectedOptions?: string[]
    isCorrect: boolean
    points: number
    timeSpent: number
  }[]
  feedback?: string
  certificate?: {
    issued: boolean
    certificateId?: string
    issuedAt?: Date
  }
  metadata: {
    ipAddress?: string
    userAgent?: string
    browserInfo?: any
    cheatingFlags?: string[]
  }
  createdAt: Date
  updatedAt: Date
}

const resultSchema = new Schema<IResult>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Student is required"],
    },
    test: {
      type: Schema.Types.ObjectId,
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
          type: Schema.Types.ObjectId,
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
        type: Schema.Types.Mixed,
      },
      cheatingFlags: [
        {
          type: String,
          trim: true,
        },
      ],
    },
  },
  {
    timestamps: true,
  },
)

// Indexes for performance
resultSchema.index({ student: 1, test: 1 })
resultSchema.index({ test: 1 })
resultSchema.index({ status: 1 })
resultSchema.index({ completedAt: -1 })
resultSchema.index({ percentage: -1 })

// Compound index for unique attempts per student per test
resultSchema.index({ student: 1, test: 1, attempt: 1 }, { unique: true })

export const Result = mongoose.model<IResult>("Result", resultSchema)
