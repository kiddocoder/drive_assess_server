/**
 * DriveReady Backend Server
 *
 * Main server file that initializes:
 * - Express application with middleware
 * - MongoDB connection
 * - Socket.IO for real-time communication
 * - Route handlers and error handling
 * - Graceful shutdown handling
 *
 * Architecture:
 * - RESTful API endpoints for CRUD operations
 * - WebSocket connections for real-time updates
 * - JWT-based authentication
 * - Role-based access control
 * - File upload capabilities
 * - Email notification system
 */

import express from "express"
import { createServer } from "http"
import cors from "cors"
import helmet from "helmet"
import compression from "compression"
import morgan from "morgan"
import rateLimit from "express-rate-limit"
import dotenv from "dotenv"

import { DatabaseService } from "./services/DatabaseService"
import { SocketService } from "./services/SocketService"
import { Logger } from "./utils/Logger"
import { errorHandler } from "./middleware/ErrorHandler"
import routes from "./routes"

// Load environment variables
dotenv.config()

class Server {
  private app: express.Application
  private httpServer: any
  private socketService: SocketService
  private databaseService: DatabaseService
  private readonly port: number

  constructor() {
    this.app = express()
    this.port = Number.parseInt(process.env.PORT || "5000")
    this.httpServer = createServer(this.app)

    // Initialize services
    this.databaseService = new DatabaseService()
    this.socketService = new SocketService(this.httpServer)

    this.initializeMiddleware()
    this.initializeRoutes()
    this.initializeErrorHandling()
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(
      helmet({
        crossOriginEmbedderPolicy: false,
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
          },
        },
      }),
    )

    // CORS configuration
    this.app.use(
      cors({
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        allowedHeaders: ["Content-Type", "Authorization"],
      }),
    )

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: "Too many requests from this IP, please try again later.",
      standardHeaders: true,
      legacyHeaders: false,
    })
    this.app.use("/api/", limiter)

    // Body parsing and compression
    this.app.use(compression())
    this.app.use(express.json({ limit: "10mb" }))
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }))

    // Logging
    this.app.use(
      morgan("combined", {
        stream: { write: (message) => Logger.info(message.trim()) },
      }),
    )

    // Health check endpoint
    this.app.get("/health", (req, res) => {
      res.status(200).json({
        status: "OK",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "development",
      })
    })
  }

  private initializeRoutes(): void {
    // API routes
    this.app.use("/api", routes)

    // 404 handler
    this.app.use("*", (req, res) => {
      res.status(404).json({
        success: false,
        message: "Route not found",
        path: req.originalUrl,
      })
    })
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler)
  }

  public async start(): Promise<void> {
    try {
      // Connect to database
      await this.databaseService.connect()
      Logger.info("✅ Database connected successfully")

      // Initialize Socket.IO
      this.socketService.initialize()
      Logger.info("✅ Socket.IO initialized")

      // Start server
      this.httpServer.listen(this.port, () => {
        Logger.info(`🚀 Server running on port ${this.port}`)
        Logger.info(`🌍 Environment: ${process.env.NODE_ENV || "development"}`)
        Logger.info(`📡 Socket.IO enabled on same port`)
        Logger.info(`🇨🇦 DriveReady Backend - Ready to serve!`)
      })

      // Graceful shutdown handling
      this.setupGracefulShutdown()
    } catch (error) {
      Logger.error("❌ Failed to start server:", error)
      process.exit(1)
    }
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      Logger.info(`📴 Received ${signal}. Starting graceful shutdown...`)

      this.httpServer.close(async () => {
        Logger.info("🔌 HTTP server closed")

        try {
          await this.databaseService.disconnect()
          Logger.info("🗄️ Database disconnected")

          Logger.info("✅ Graceful shutdown completed")
          process.exit(0)
        } catch (error) {
          Logger.error("❌ Error during shutdown:", error)
          process.exit(1)
        }
      })

      // Force close after 30 seconds
      setTimeout(() => {
        Logger.error("⚠️ Forced shutdown after timeout")
        process.exit(1)
      }, 30000)
    }

    process.on("SIGTERM", () => shutdown("SIGTERM"))
    process.on("SIGINT", () => shutdown("SIGINT"))
  }
}

// Start the server
const server = new Server()
server.start().catch((error) => {
  Logger.error("💥 Fatal error starting server:", error)
  process.exit(1)
})
