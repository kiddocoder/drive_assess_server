/**
 * Logger Utility
 *
 * Centralized logging system using Winston:
 * - Different log levels (error, warn, info, debug)
 * - File and console output
 * - Structured logging with timestamps
 * - Environment-based configuration
 */

import winston from "winston"
import path from "path"

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), "logs")

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: "driveready-api" },
  transports: [
    // Write all logs with importance level of `error` or less to `error.log`
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
    }),
    // Write all logs with importance level of `info` or less to `combined.log`
    new winston.transports.File({
      filename: path.join(logsDir, "combined.log"),
    }),
  ],
})

// If we're not in production, log to the console with a simple format
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
  )
}

export const Logger = logger
