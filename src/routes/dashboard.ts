/**
 * Dashboard Routes
 *
 * Handles dashboard analytics and statistics:
 * - Real-time dashboard data
 * - Analytics and charts
 * - Live activity feeds
 * - System health monitoring
 */

import { Router } from "express"
import { DashboardController } from "../controllers/dashboard.controller"
import { authenticateToken } from "../middleware/auth.middleware"
import { SocketService } from "../services/SocketService"
import Application from "../Application"
import { createServer } from "http"

const router = Router()
const app = new Application().start() // initialize our app


// Initialize dashboard controller with socket service
const socketService = new SocketService(createServer(app))
const dashboardController = new DashboardController(socketService)

// All routes require authentication
router.use(authenticateToken)

// Routes
router.get("/stats", dashboardController.getDashboardStats)
router.get("/analytics", dashboardController.getAnalytics)
router.get("/live-activity", dashboardController.getLiveActivity)

export default router
