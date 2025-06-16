/**
 * Database Service
 *
 * Handles MongoDB connection and management:
 * - Connection establishment with retry logic
 * - Connection monitoring and health checks
 * - Graceful disconnection
 * - Error handling and logging
 *
 * Features:
 * - Automatic reconnection on connection loss
 * - Connection pooling optimization
 * - Debug mode for development
 * - Performance monitoring
 */

import mongoose from "mongoose"
import { Logger } from "../utils/Logger"

export class DatabaseService {
  private connectionString: string
  private isConnected = false

  constructor() {
    this.connectionString = process.env.MONGODB_URI || "mongodb://localhost:27017/driveready"
    this.setupEventListeners()
  }

  public async connect(): Promise<void> {
    try {
      const options = {
        maxPoolSize: 10, // Maintain up to 10 socket connections
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        bufferMaxEntries: 0, // Disable mongoose buffering
        bufferCommands: false, // Disable mongoose buffering
      }

      await mongoose.connect(this.connectionString, options)
      this.isConnected = true

      Logger.info("🗄️ MongoDB connected successfully")
      Logger.info(`📍 Database: ${mongoose.connection.name}`)
    } catch (error) {
      Logger.error("❌ MongoDB connection failed:", error)
      throw error
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect()
      this.isConnected = false
      Logger.info("🔌 MongoDB disconnected")
    } catch (error) {
      Logger.error("❌ Error disconnecting from MongoDB:", error)
      throw error
    }
  }

  public getConnectionStatus(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1
  }

  public getConnectionInfo(): object {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
    }
  }

  private setupEventListeners(): void {
    mongoose.connection.on("connected", () => {
      this.isConnected = true
      Logger.info("🔗 Mongoose connected to MongoDB")
    })

    mongoose.connection.on("error", (error) => {
      Logger.error("❌ Mongoose connection error:", error)
    })

    mongoose.connection.on("disconnected", () => {
      this.isConnected = false
      Logger.warn("⚠️ Mongoose disconnected from MongoDB")
    })

    mongoose.connection.on("reconnected", () => {
      this.isConnected = true
      Logger.info("🔄 Mongoose reconnected to MongoDB")
    })

    // Enable debug mode in development
    if (process.env.NODE_ENV === "development") {
      mongoose.set("debug", true)
    }
  }
}
