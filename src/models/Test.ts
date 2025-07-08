/**
 * Test Model
 *
 * Defines the test/quiz schema:
 * - Test metadata and configuration
 * - Question references and ordering
 * - Scoring and timing settings
 * - Category and difficulty classification
 * - Instructor and creation tracking
 */

import mongoose, { type Document, Schema } from "mongoose"

export interface ITest extends Document {
  title: string
  description: string
  instructor: mongoose.Types.ObjectId
  questions: mongoose.Types.ObjectId[]
  timeLimit: number // in minutes
  passingScore: number // percentage
  maxAttempts: number
  attempts: number
  isActive: boolean
  isPublished: boolean
  points:number
  status:string
  settings: {
    shuffleQuestions: boolean
    shuffleAnswers: boolean
    showResults: boolean
    allowReview: boolean
    requireProctoring: boolean
  }
  tags: string[]
  completions: number
  averageScore: number
  passRate: number
  createdAt: Date
  updatedAt: Date
}

const testSchema = new Schema<ITest>(
  {
    title: {
      type: String,
      required: [true, "Test title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: false,
      default:""
    },
    instructor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default:null
    },
    questions: [
      {
        type: Schema.Types.ObjectId,
        ref: "Question",
        default: null,
      },
    ],
    points:{
      type:Number,
      default:0
    },
    status:{
      type:String,
      default:"active"
    },
    timeLimit: {
      type: Number,
      default:1,
      min: [1, "Time limit must be at least 1 minute"],
      max: [300, "Time limit cannot exceed 300 minutes"],
    },
    passingScore: {
      type: Number,
      required: false,
      min: [0, "Passing score cannot be negative"],
      max: [100, "Passing score cannot exceed 100%"],
      default: 70,
    },
    maxAttempts: {
      type: Number,
      default: 3,
      min: [1, "Must allow at least 1 attempt"],
    },
    attempts: {
      type: Number,
      default: 1,
      min: [0, "Attempts cannot be negative"],
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
  },
  {
    timestamps: true,
  },
)

// Indexes for performance
testSchema.index({ instructor: 1 })
testSchema.index({ isActive: 1, isPublished: 1 })
testSchema.index({ tags: 1 })

// Virtual for question count
testSchema.virtual("questionCount").get(function () {
  return this.questions.length
})

export const Test = mongoose.model<ITest>("Test", testSchema)
