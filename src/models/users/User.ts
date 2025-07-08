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
  role: mongoose.Types.ObjectId
  phone?: string
  location?: string
  avatar?: string
  isEmailVerified: boolean
  isActive: boolean
  lastLogin?: Date
  loginAttempts: number
  lockUntil?: Date
  subscription: mongoose.Types.ObjectId
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
      type: Schema.Types.ObjectId,
      ref: "Role",
      required: [true, "Role is required"],
    },
    phone: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
      maxlength: [255, "Location cannot exceed 255 characters"],
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
    subscription: 
      {
      type:mongoose.Schema.Types.ObjectId,
      ref:"Subscription",
      default: null
    }
  ,
    profile: {
      type: Schema.Types.ObjectId,
      ref: "Profile",
      default: null,  
    },
    preferences: [
      {
        type: Schema.Types.ObjectId,
        ref: "Preference",
        default: null,
      },
    ]
  },
  {
    timestamps: true,
    collection:"users",
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
userSchema.index({ "subscription.plan": 1 })

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

  console.log(payload)

  return jwt.sign(this.toJSON(),
   process.env.JWT_SECRET || "Here",{
   expiresIn:"1d",
  })

}

export const User = mongoose.model<IUser>("User", userSchema)
