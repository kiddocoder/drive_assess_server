/**
 * Socket Service
 *
 * Manages real-time communication using Socket.IO:
 * - User authentication and session management
 * - Real-time dashboard updates
 * - Live test session monitoring
 * - Instant notifications
 * - System health broadcasting
 *
 * Events:
 * - dashboard:update - Real-time dashboard data
 * - test:started - Test session started
 * - test:completed - Test session completed
 * - notification:new - New notification
 * - user:online - User came online
 * - user:offline - User went offline
 */

import { Server as SocketIOServer, type Socket } from "socket.io"
import jwt from "jsonwebtoken"
import { Logger } from "../utils/Logger"

interface AuthenticatedSocket extends Socket {
  userId?: string
  userRole?: string
}

export class SocketService {
  private io: SocketIOServer
  private connectedUsers: Map<string, string> = new Map() // userId -> socketId

  constructor(httpServer: any) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ["websocket", "polling"],
    })
  }

  public initialize(): void {
    this.io.use(this.authenticateSocket.bind(this))
    this.io.on("connection", this.handleConnection.bind(this))
    Logger.info("🔌 Socket.IO service initialized")
  }

  private async authenticateSocket(socket: any, next: any): Promise<void> {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(" ")[1]

      if (!token) {
        return next(new Error("Authentication token required"))
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
      socket.userId = decoded.userId
      socket.userRole = decoded.role

      next()
    } catch (error) {
      Logger.error("Socket authentication failed:", error)
      next(new Error("Invalid authentication token"))
    }
  }

  private handleConnection(socket: AuthenticatedSocket): void {
    const userId = socket.userId!
    const userRole = socket.userRole!

    // Store user connection
    this.connectedUsers.set(userId, socket.id)

    Logger.info(`👤 User connected: ${userId} (${userRole}) - Socket: ${socket.id}`)

    // Join role-based rooms
    socket.join(`role:${userRole}`)
    socket.join(`user:${userId}`)

    // Emit user online status
    this.broadcastUserStatus(userId, "online")

    // Handle dashboard subscription
    socket.on("dashboard:subscribe", () => {
      socket.join("dashboard")
      Logger.info(`📊 User ${userId} subscribed to dashboard updates`)
    })

    // Handle test session events
    socket.on("test:join", (testId: string) => {
      socket.join(`test:${testId}`)
      Logger.info(`📝 User ${userId} joined test session: ${testId}`)
    })

    socket.on("test:leave", (testId: string) => {
      socket.leave(`test:${testId}`)
      Logger.info(`📝 User ${userId} left test session: ${testId}`)
    })

    // Handle real-time test progress
    socket.on("test:progress", (data: { testId: string; progress: number; currentQuestion: number }) => {
      socket.to(`test:${data.testId}`).emit("test:progress:update", {
        userId,
        ...data,
        timestamp: new Date(),
      })
    })

    // Handle notifications
    socket.on("notification:read", (notificationId: string) => {
      Logger.info(`📬 User ${userId} read notification: ${notificationId}`)
      // Update notification status in database
    })

    // Handle disconnection
    socket.on("disconnect", (reason: string) => {
      this.connectedUsers.delete(userId)
      this.broadcastUserStatus(userId, "offline")
      Logger.info(`👋 User disconnected: ${userId} - Reason: ${reason}`)
    })

    // Send initial connection success
    socket.emit("connection:success", {
      message: "Connected to DriveReady real-time service",
      userId,
      userRole,
      timestamp: new Date(),
    })
  }

  // Public methods for broadcasting events

  public broadcastDashboardUpdate(data: any): void {
    this.io.to("dashboard").emit("dashboard:update", {
      ...data,
      timestamp: new Date(),
    })
    Logger.info("📊 Dashboard update broadcasted")
  }

  public notifyTestStart(testId: string, studentId: string, testData: any): void {
    this.io.to(`test:${testId}`).emit("test:started", {
      testId,
      studentId,
      testData,
      timestamp: new Date(),
    })

    // Notify instructors and admins
    this.io.to("role:instructor").to("role:admin").emit("test:session:started", {
      testId,
      studentId,
      testData,
      timestamp: new Date(),
    })

    Logger.info(`📝 Test start notification sent for test: ${testId}`)
  }

  public notifyTestCompletion(testId: string, studentId: string, results: any): void {
    this.io.to(`test:${testId}`).emit("test:completed", {
      testId,
      studentId,
      results,
      timestamp: new Date(),
    })

    // Notify the specific student
    this.io.to(`user:${studentId}`).emit("test:results", {
      testId,
      results,
      timestamp: new Date(),
    })

    Logger.info(`✅ Test completion notification sent for test: ${testId}`)
  }

  public sendNotification(userId: string, notification: any): void {
    this.io.to(`user:${userId}`).emit("notification:new", {
      ...notification,
      timestamp: new Date(),
    })
    Logger.info(`📬 Notification sent to user: ${userId}`)
  }

  public broadcastSystemAlert(alert: any): void {
    this.io.emit("system:alert", {
      ...alert,
      timestamp: new Date(),
    })
    Logger.info("🚨 System alert broadcasted")
  }

  public notifyPaymentUpdate(userId: string, paymentData: any): void {
    this.io.to(`user:${userId}`).emit("payment:update", {
      ...paymentData,
      timestamp: new Date(),
    })
    Logger.info(`💳 Payment update sent to user: ${userId}`)
  }

  private broadcastUserStatus(userId: string, status: "online" | "offline"): void {
    this.io.to("role:instructor").to("role:admin").emit("user:status", {
      userId,
      status,
      timestamp: new Date(),
    })
  }

  public getConnectedUsersCount(): number {
    return this.connectedUsers.size
  }

  public getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys())
  }

  public isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId)
  }
}
