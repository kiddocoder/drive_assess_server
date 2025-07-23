/**
 * Authentication Controller
 *
 * Handles all authentication-related operations:
 * - User registration and login
 * - JWT token generation and validation
 * - Password reset functionality
 * - Account verification
 * - Session management
 *
 * Security Features:
 * - Account lockout after failed attempts
 * - Password strength validation
 * - Email verification
 * - Rate limiting protection
 */

import  { Request, Response } from "express"
import jwt from "jsonwebtoken"
import { validationResult } from "express-validator"
import { User } from "../models/users/User"
import { EmailService } from "../services/EmailService"
import { Logger } from "../utils/Logger"
import { Role } from "../models/users/Role"

export class AuthController {
  private emailService: EmailService

  constructor() {
    this.emailService = new EmailService()
  }

  public register = async (req: Request, res: Response): Promise<void> => {
    try {
      // Check validation errors
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
         res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
        return;
      }

      const { name, email, password, phone, location } = req.body

      const role = await Role.findOne({name:'student'});


      // Check if user already exists
      const existingUser = await User.findOne({ email })
      if (existingUser) {
        res.status(409).json({
          success: false,
          message: "User already exists with this email",
        })
        return
      }

      // Check if phone already exists
      const existingPhone = await User.findOne({ phone })
      if (existingPhone) {
        res.status(409).json({
          success: false,
          message: "This phone number is already used !",
        })
        return
      }

      // Create new user
      const user = new User({
        name,
        email,
        password,
        role:role?._id,
        phone,
        location,
      })

      await user.save()

      // Generate JWT token
      const token = user.generateToken()

      // Send verification email
      await this.emailService.sendVerificationEmail(user.email, user.name, token)

      Logger.info(`New user registered: ${email} (${role?.name})`)

      res.status(201).json({
        success: true,
        message: "User registered successfully. Please check your email for verification.",
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
          },
          token,
        },
      })
    } catch (error: any) {
      Logger.error("Registration error:", error)
      res.status(500).json({
        success: false,
        message: "Internal server error during registration",
      })
    }
  }

  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { identifier, password } = req.body
      const emailOrPhone = identifier; // either email or phone number 

      // Find user by either email or phone number and include password for comparison
      const user = await User.findOne({
        $or: [
          { email: emailOrPhone },
          { phone: emailOrPhone }
        ]
      }).select("+password")
      .populate("subscription")
      .populate("role");

      if (!user) {
        res.status(401).json({
          success: false,
          message: "Invalid email or password",
        })
        return
      }

      // Check if account is locked
      if (user.isLocked()) {
        res.status(423).json({
          success: false,
          message: "Account is temporarily locked due to too many failed login attempts",
        })
        return
      }

      // Check if account is active
      if (!user.isActive) {
        res.status(403).json({
          success: false,
          message: "Account is deactivated. Please contact support.",
        })
        return
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password)
      if (!isPasswordValid) {
        await user.incrementLoginAttempts()
        res.status(401).json({
          success: false,
          message: "Invalid email or password",
        })
        return
      }

      // Reset login attempts on successful login
      if (user.loginAttempts > 0) {
        await user.resetLoginAttempts()
      }

      // Update last login
      user.lastLogin = new Date()
      await user.save()

      // Generate JWT token
      const token = user.generateToken()

      Logger.info(`User logged in: ${emailOrPhone} (${user.role})`)


      res.cookie("accessToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000,
      })

      res.status(200).json({
        success: true,
        message: "Login successful",
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            lastLogin: user.lastLogin,
            subscription: user.subscription,
        },
      token,
      })
    } catch (error: any) {
      Logger.error("Login error:", error)
      res.status(500).json({
        success: false,
        message: "Internal server error during login",
      })
    }
  }

  public logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.userId

      const user = await User.findById(userId)
      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found",
        })
        return
      }

      // Clear the access token cookie
      res.clearCookie("accessToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: "strict",
      })
      Logger.info("User logged out successfully")
      res.status(200).json({
        success: true,
        message: "Logout successful",
      })
    } catch (error: any) {
      Logger.error("Logout error:", error)
      res.status(500).json({
        success: false,
        message: "Internal server error during logout",
      })
    }
  }

  public verifyEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.params

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
      const user = await User.findById(decoded.userId)

      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found",
        })
        return
      }

      if (user.isEmailVerified) {
        res.status(400).json({
          success: false,
          message: "Email is already verified",
        })
        return
      }

      // Update user verification status
      user.isEmailVerified = true
      await user.save()

      Logger.info(`Email verified for user: ${user.email}`)

      res.status(200).json({
        success: true,
        message: "Email verified successfully",
      })
    } catch (error: any) {
      Logger.error("Email verification error:", error)
      res.status(400).json({
        success: false,
        message: "Invalid or expired verification token",
      })
    }
  }

  public forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body

      const user = await User.findOne({ email })
      if (!user) {
        // Don't reveal if email exists or not
        res.status(200).json({
          success: true,
          message: "If the email exists, a password reset link has been sent",
        })
        return
      }

      // Generate reset token
      const resetToken = user.generateToken()

      // Send reset email
      await this.emailService.sendPasswordResetEmail(user.email, user.name, resetToken)

      Logger.info(`Password reset requested for: ${email}`)

      res.status(200).json({
        success: true,
        message: "If the email exists, a password reset link has been sent",
      })
    } catch (error: any) {
      Logger.error("Forgot password error:", error)
      res.status(500).json({
        success: false,
        message: "Internal server error",
      })
    }
  }

  public resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.params
      const { password } = req.body

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
      const user = await User.findById(decoded.userId)

      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found",
        })
        return
      }

      // Update password
      user.password = password
      await user.save()

      Logger.info(`Password reset completed for: ${user.email}`)

      res.status(200).json({
        success: true,
        message: "Password reset successfully",
      })
    } catch (error: any) {
      Logger.error("Reset password error:", error)
      res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      })
    }
  }

  public getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.userId

      const user = await User.findById(userId)
      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found",
        })
        return
      }

      res.status(200).json({
        success: true,
        data: { user },
      })
    } catch (error: any) {
      Logger.error("Get profile error:", error)
      res.status(500).json({
        success: false,
        message: "Internal server error",
      })
    }
  }

  public updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.userId
      const updates = req.body

      // Remove sensitive fields that shouldn't be updated via this endpoint
      delete updates.password
      delete updates.email
      delete updates.role
      delete updates.isEmailVerified
      delete updates.loginAttempts
      delete updates.lockUntil

      const user = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true, runValidators: true })

      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found",
        })
        return
      }

      Logger.info(`Profile updated for user: ${user.email}`)

      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: { user },
      })
    } catch (error: any) {
      Logger.error("Update profile error:", error)
      res.status(500).json({
        success: false,
        message: "Internal server error",
      })
    }
  }
}

export default new AuthController()
