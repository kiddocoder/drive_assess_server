/**
 * Category Model
 *
 * Defines categories for organizing tests and questions:
 * - Hierarchical category structure
 * - Category metadata and descriptions
 * - Usage statistics
 * - Active/inactive status
 */

import mongoose, { type Document, Schema } from "mongoose"

export interface ICategory extends Document {
  name: string
  description?: string
  slug: string
  parent?: mongoose.Types.ObjectId
  icon?: string
  isActive: boolean
  sortOrder: number
  metadata: {
    testCount: number
    questionCount: number
    studentCount: number
  }
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    slug: {
      type: String,
      required: false,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"],
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    icon: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    metadata: {
      testCount: {
        type: Number,
        default: 0,
        min: [0, "Test count cannot be negative"],
      },
      questionCount: {
        type: Number,
        default: 0,
        min: [0, "Question count cannot be negative"],
      },
      studentCount: {
        type: Number,
        default: 0,
        min: [0, "Student count cannot be negative"],
      },
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default:null
    },
  },
  {
    timestamps: true,
  },
)

categorySchema.pre('save',function (){
  this.slug = this.name.split(' ').join('-')
})

// Indexes for performance
categorySchema.index({ parent: 1 })
categorySchema.index({ isActive: 1 })
categorySchema.index({ sortOrder: 1 })

export const Category = mongoose.model<ICategory>("Category", categorySchema)
