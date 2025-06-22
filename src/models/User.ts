/**
 * User Model
 *
 * Defines the user schema for the DriveReady platform:
 * - Authentication and authorization
 * - Profile information
 * - Role-based access control
 * - Account security features
 * - Activity tracking
 *
 * Roles:
 * - admin: Full system access
 * - instructor: Can create tests and view results
 * - student: Can take tests and view own results
 */

import mongoose, { type Document, Schema } from "mongoose"
import bcrypt from "bcryptjs"
import jwt,{JwtPayload} from "jsonwebtoken"

export interface IUser extends Document {
  name: string
  email: string
  password: string
  role: "admin" | "instructor" | "student"
  phone?: string
  location?: string
  avatar?: string
  isEmailVerified: boolean
  isActive: boolean
  lastLogin?: Date
  loginAttempts: number
  lockUntil?: Date
  subscription?: {
    type: "free" | "3-day" | "4-day" | "premium"
    startDate: Date
    endDate?: Date
    isActive: boolean
  }
  profile?: {
    bio?: string
    specialization?: string[]
    experience?: number
    certifications?: string[]
    rating?: number
    studentsCount?: number
    testsCreated?: number
  }
  preferences?: {
    language: string
    timezone: string
    notifications: {
      email: boolean
      push: boolean
      sms: boolean
    }
  }
  createdAt: Date
  updatedAt: Date
  comparePassword(candidatePassword: string): Promise<boolean>
  generateToken():string
  incrementLoginAttempts(): Promise<void>
  resetLoginAttempts(): Promise<void>
  isLocked(): boolean
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Don't include password in queries by default
    },
    role: {
      type: String,
      enum: ["admin", "instructor", "student"],
      default: "student",
      required: true,
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s\-$$$$]+$/, "Please enter a valid phone number"],
    },
    location: {
      type: String,
      trim: true,
      maxlength: [100, "Location cannot exceed 100 characters"],
    },
    avatar: {
      type: String,
      default: null,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
    subscription: {
      type: {
        type: String,
        enum: ["free", "3-day", "4-day", "premium"],
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
    },
    profile: {
      bio: {
        type: String,
        maxlength: [500, "Bio cannot exceed 500 characters"],
      },
      specialization: [
        {
          type: String,
          trim: true,
        },
      ],
      experience: {
        type: Number,
        min: [0, "Experience cannot be negative"],
        max: [50, "Experience cannot exceed 50 years"],
      },
      certifications: [
        {
          type: String,
          trim: true,
        },
      ],
      rating: {
        type: Number,
        min: [0, "Rating cannot be less than 0"],
        max: [5, "Rating cannot exceed 5"],
        default: 0,
      },
      studentsCount: {
        type: Number,
        default: 0,
        min: [0, "Students count cannot be negative"],
      },
      testsCreated: {
        type: Number,
        default: 0,
        min: [0, "Tests created cannot be negative"],
      },
    },
    preferences: {
      language: {
        type: String,
        default: "en",
        enum: ["en", "fr", "es", "ar"],
      },
      timezone: {
        type: String,
        default: "America/Toronto",
      },
      notifications: {
        email: {
          type: Boolean,
          default: true,
        },
        push: {
          type: Boolean,
          default: true,
        },
        sms: {
          type: Boolean,
          default: false,
        },
      },
    },
  },
  {
    timestamps: true,
    collection:"user",
    toJSON: {
      transform: (doc, ret) => {
        delete ret.password
        delete ret.loginAttempts
        delete ret.lockUntil
        return ret
      },
    },
  },
)

// Indexes for performance
userSchema.index({ role: 1 })
userSchema.index({ isActive: 1 })
userSchema.index({ "subscription.type": 1 })

// Pre-save middleware to hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()

  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error: any) {
    next(error)
  }
})

// Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password)
}

// Instance method to increment login attempts
userSchema.methods.incrementLoginAttempts = async function (): Promise<void> {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 },
    })
  }

  const updates: any = { $inc: { loginAttempts: 1 } }

  // If we have hit max attempts and it's not locked, lock the account
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 } // 2 hours
  }

  return this.updateOne(updates)
}

// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = async function (): Promise<void> {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
  })
}

// Instance method to check if account is locked
userSchema.methods.isLocked = function (): boolean {
  return !!(this.lockUntil && this.lockUntil > Date.now())
}

// Virtual for account lock status
userSchema.virtual("isAccountLocked").get(function () {
  return this.isLocked()
})

userSchema.methods.generateToken = function():string{
  const payload:JwtPayload = ():Object => {
    return this
  } ;

  return jwt.sign(payload,process.env.JWT_SECRET || "Here",{
   expiresIn:"1d",
  })

}

export const User = mongoose.model<IUser>("User", userSchema)
