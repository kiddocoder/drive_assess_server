/**
 * Email Service
 *
 * Handles all email communications:
 * - Welcome and verification emails
 * - Password reset emails
 * - Test completion notifications
 * - Payment confirmations
 * - System notifications
 */

import nodemailer from "nodemailer"
import { Logger } from "../utils/Logger"

export class EmailService {
  private transporter: nodemailer.Transporter

  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: Number.parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }

  public async sendVerificationEmail(email: string, name: string, token: string): Promise<void> {
    try {
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`

      const mailOptions = {
        from: `"DriveReady" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "🚗 Welcome to DriveReady - Verify Your Email",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
            <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🚗 DriveReady</h1>
              <p style="color: #fecaca; margin: 10px 0 0 0;">Your Canadian Driving Test Platform</p>
            </div>
            
            <div style="padding: 40px 30px; background-color: white;">
              <h2 style="color: #1f2937; margin-bottom: 20px;">Welcome, ${name}! 🎉</h2>
              
              <p style="color: #4b5563; line-height: 1.6; margin-bottom: 25px;">
                Thank you for joining DriveReady! We're excited to help you prepare for your Canadian driving test.
              </p>
              
              <p style="color: #4b5563; line-height: 1.6; margin-bottom: 30px;">
                To get started, please verify your email address by clicking the button below:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" 
                   style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); 
                          color: white; 
                          padding: 15px 30px; 
                          text-decoration: none; 
                          border-radius: 8px; 
                          font-weight: bold;
                          display: inline-block;">
                  Verify Email Address
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${verificationUrl}" style="color: #dc2626;">${verificationUrl}</a>
              </p>
            </div>
            
            <div style="background-color: #f3f4f6; padding: 20px 30px; text-align: center;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                © 2024 DriveReady. All rights reserved.<br>
                Helping Canadians pass their driving tests with confidence! 🇨🇦
              </p>
            </div>
          </div>
        `,
      }

      await this.transporter.sendMail(mailOptions)
      Logger.info(`Verification email sent to: ${email}`)
    } catch (error: any) {
      Logger.error("Send verification email error:", error)
      throw error
    }
  }

  public async sendPasswordResetEmail(email: string, name: string, token: string): Promise<void> {
    try {
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`

      const mailOptions = {
        from: `"DriveReady" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "🔐 Reset Your DriveReady Password",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
            <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🚗 DriveReady</h1>
              <p style="color: #fecaca; margin: 10px 0 0 0;">Password Reset Request</p>
            </div>
            
            <div style="padding: 40px 30px; background-color: white;">
              <h2 style="color: #1f2937; margin-bottom: 20px;">Hi ${name},</h2>
              
              <p style="color: #4b5563; line-height: 1.6; margin-bottom: 25px;">
                We received a request to reset your password for your DriveReady account.
              </p>
              
              <p style="color: #4b5563; line-height: 1.6; margin-bottom: 30px;">
                Click the button below to create a new password:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); 
                          color: white; 
                          padding: 15px 30px; 
                          text-decoration: none; 
                          border-radius: 8px; 
                          font-weight: bold;
                          display: inline-block;">
                  Reset Password
                </a>
              </div>
              
              <p style="color: #ef4444; font-size: 14px; margin-bottom: 20px;">
                ⚠️ This link will expire in 1 hour for security reasons.
              </p>
              
              <p style="color: #6b7280; font-size: 14px;">
                If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
              </p>
              
              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${resetUrl}" style="color: #dc2626;">${resetUrl}</a>
              </p>
            </div>
            
            <div style="background-color: #f3f4f6; padding: 20px 30px; text-align: center;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                © 2024 DriveReady. All rights reserved.<br>
                Stay safe on Canadian roads! 🇨🇦
              </p>
            </div>
          </div>
        `,
      }

      await this.transporter.sendMail(mailOptions)
      Logger.info(`Password reset email sent to: ${email}`)
    } catch (error: any) {
      Logger.error("Send password reset email error:", error)
      throw error
    }
  }

  public async sendTestCompletionEmail(
    email: string,
    name: string,
    testTitle: string,
    score: number,
    passed: boolean,
  ): Promise<void> {
    try {
      const mailOptions = {
        from: `"DriveReady" <${process.env.SMTP_USER}>`,
        to: email,
        subject: `${passed ? "🎉" : "📚"} Test ${passed ? "Passed" : "Completed"}: ${testTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
            <div style="background: linear-gradient(135deg, ${passed ? "#16a34a" : "#dc2626"} 0%, ${passed ? "#15803d" : "#b91c1c"} 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🚗 DriveReady</h1>
              <p style="color: ${passed ? "#bbf7d0" : "#fecaca"}; margin: 10px 0 0 0;">Test Results</p>
            </div>
            
            <div style="padding: 40px 30px; background-color: white;">
              <h2 style="color: #1f2937; margin-bottom: 20px;">Hi ${name},</h2>
              
              <p style="color: #4b5563; line-height: 1.6; margin-bottom: 25px;">
                You have completed the test: <strong>${testTitle}</strong>
              </p>
              
              <div style="background-color: ${passed ? "#f0fdf4" : "#fef2f2"}; border: 2px solid ${passed ? "#16a34a" : "#dc2626"}; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
                <h3 style="color: ${passed ? "#16a34a" : "#dc2626"}; margin: 0 0 10px 0;">
                  ${passed ? "🎉 Congratulations!" : "📚 Keep Practicing!"}
                </h3>
                <p style="font-size: 24px; font-weight: bold; color: ${passed ? "#16a34a" : "#dc2626"}; margin: 0;">
                  Score: ${score}%
                </p>
                <p style="color: #4b5563; margin: 10px 0 0 0;">
                  ${passed ? "You passed the test!" : "You can retake the test to improve your score."}
                </p>
              </div>
              
              ${
                passed
                  ? `
                <p style="color: #4b5563; line-height: 1.6; margin-bottom: 25px;">
                  Great job! You're one step closer to getting your Canadian driver's license.
                </p>
              `
                  : `
                <p style="color: #4b5563; line-height: 1.6; margin-bottom: 25px;">
                  Don't worry! Practice makes perfect. Review the material and try again when you're ready.
                </p>
              `
              }
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL}/dashboard" 
                   style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); 
                          color: white; 
                          padding: 15px 30px; 
                          text-decoration: none; 
                          border-radius: 8px; 
                          font-weight: bold;
                          display: inline-block;">
                  View Dashboard
                </a>
              </div>
            </div>
            
            <div style="background-color: #f3f4f6; padding: 20px 30px; text-align: center;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                © 2024 DriveReady. All rights reserved.<br>
                Your success is our priority! 🇨🇦
              </p>
            </div>
          </div>
        `,
      }

      await this.transporter.sendMail(mailOptions)
      Logger.info(`Test completion email sent to: ${email}`)
    } catch (error: any) {
      Logger.error("Send test completion email error:", error)
      throw error
    }
  }
}
