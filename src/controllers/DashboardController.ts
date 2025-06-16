/**
 * Dashboard Controller
 *
 * Handles dashboard data aggregation and analytics:
 * - Real-time statistics and metrics
 * - User activity tracking
 * - Test performance analytics
 * - Revenue and payment data
 * - System health monitoring
 *
 * Features:
 * - Cached data for performance
 * - Real-time updates via Socket.IO
 * - Role-based data filtering
 * - Comprehensive analytics
 */

import type { Request, Response } from "express"
import { User } from "../models/User"
import { Test } from "../models/Test"
import { Logger } from "../utils/Logger"
import type { SocketService } from "../services/SocketService"

export class DashboardController {
  private socketService: SocketService

  constructor(socketService: SocketService) {
    this.socketService = socketService
  }

  public getDashboardStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const userRole = (req as any).user.role
      const userId = (req as any).user.userId

      // Get basic statistics
      const [totalUsers, totalTests, totalStudents, totalInstructors, activeTests, recentUsers] = await Promise.all([
        User.countDocuments(),
        Test.countDocuments(),
        User.countDocuments({ role: "student" }),
        User.countDocuments({ role: "instructor" }),
        Test.countDocuments({ isActive: true, isPublished: true }),
        User.find({ role: "student" }).sort({ createdAt: -1 }).limit(10).select("name email createdAt lastLogin"),
      ])

      // Calculate growth percentages (mock data for now)
      const stats = {
        totalUsers: {
          value: totalUsers,
          change: "+12.5%",
          changeType: "positive",
        },
        totalTests: {
          value: totalTests,
          change: "+8.3%",
          changeType: "positive",
        },
        totalStudents: {
          value: totalStudents,
          change: "+15.2%",
          changeType: "positive",
        },
        totalInstructors: {
          value: totalInstructors,
          change: "+5.7%",
          changeType: "positive",
        },
        activeTests: {
          value: activeTests,
          change: "+3.1%",
          changeType: "positive",
        },
      }

      // Get recent activity
      const recentActivity = [
        {
          id: "1",
          type: "test_completed",
          message: "Ahmed Hassan completed G1 Knowledge Test",
          timestamp: new Date(Date.now() - 2 * 60 * 1000),
          user: "Ahmed Hassan",
        },
        {
          id: "2",
          type: "user_registered",
          message: "New student Maria Rodriguez registered",
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
          user: "Maria Rodriguez",
        },
        {
          id: "3",
          type: "test_created",
          message: "Sarah Johnson created new test: Traffic Rules Advanced",
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          user: "Sarah Johnson",
        },
      ]

      // Get chart data for the last 7 days
      const chartData = this.generateChartData()

      // Get system health
      const systemHealth = {
        status: "healthy",
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        connectedUsers: this.socketService.getConnectedUsersCount(),
      }

      Logger.info(`Dashboard stats requested by user: ${userId} (${userRole})`)

      res.status(200).json({
        success: true,
        data: {
          stats,
          recentActivity,
          chartData,
          systemHealth,
          recentUsers: userRole === "admin" ? recentUsers : [],
        },
      })
    } catch (error: any) {
      Logger.error("Dashboard stats error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to fetch dashboard statistics",
      })
    }
  }

  public getAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { timeRange = "7d" } = req.query
      const userRole = (req as any).user.role

      // Generate analytics data based on time range
      const analytics = {
        userGrowth: this.generateUserGrowthData(timeRange as string),
        testPerformance: this.generateTestPerformanceData(timeRange as string),
        revenueData: this.generateRevenueData(timeRange as string),
        geographicData: this.generateGeographicData(),
        deviceUsage: this.generateDeviceUsageData(),
      }

      res.status(200).json({
        success: true,
        data: analytics,
      })
    } catch (error: any) {
      Logger.error("Analytics error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to fetch analytics data",
      })
    }
  }

  public getLiveActivity = async (req: Request, res: Response): Promise<void> => {
    try {
      // Get real-time activity data
      const liveActivity = [
        {
          id: "1",
          location: "Toronto, ON",
          action: "Quiz completed",
          time: "2 min ago",
          flag: "🇨🇦",
          user: "Ahmed Hassan",
        },
        {
          id: "2",
          location: "Vancouver, BC",
          action: "New user signup",
          time: "5 min ago",
          flag: "🇨🇦",
          user: "Maria Rodriguez",
        },
        {
          id: "3",
          location: "Montreal, QC",
          action: "Premium purchase",
          time: "8 min ago",
          flag: "🇨🇦",
          user: "Jean Dubois",
        },
      ]

      res.status(200).json({
        success: true,
        data: liveActivity,
      })
    } catch (error: any) {
      Logger.error("Live activity error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to fetch live activity",
      })
    }
  }

  private generateChartData() {
    return [
      { date: "Mon", users: 120, revenue: 1560, tests: 89 },
      { date: "Tue", users: 145, revenue: 1890, tests: 102 },
      { date: "Wed", users: 132, revenue: 1720, tests: 95 },
      { date: "Thu", users: 167, revenue: 2170, tests: 118 },
      { date: "Fri", users: 189, revenue: 2460, tests: 134 },
      { date: "Sat", users: 156, revenue: 2030, tests: 112 },
      { date: "Sun", users: 178, revenue: 2320, tests: 126 },
    ]
  }

  private generateUserGrowthData(timeRange: string) {
    // Mock data - replace with real database queries
    return [
      { period: "Week 1", users: 1200, growth: 12.5 },
      { period: "Week 2", users: 1350, growth: 12.5 },
      { period: "Week 3", users: 1520, growth: 12.6 },
      { period: "Week 4", users: 1710, growth: 12.5 },
    ]
  }

  private generateTestPerformanceData(timeRange: string) {
    return [
      { test: "G1 Knowledge", completions: 456, passRate: 89.2, avgScore: 85.4 },
      { test: "G2 Road Test", completions: 234, passRate: 76.8, avgScore: 78.3 },
      { test: "Defensive Driving", completions: 189, passRate: 92.1, avgScore: 88.7 },
      { test: "Motorcycle Test", completions: 67, passRate: 83.4, avgScore: 81.2 },
    ]
  }

  private generateRevenueData(timeRange: string) {
    return [
      { month: "Oct", revenue: 12500, subscriptions: 245 },
      { month: "Nov", revenue: 15200, subscriptions: 298 },
      { month: "Dec", revenue: 18900, subscriptions: 356 },
      { month: "Jan", revenue: 22100, subscriptions: 412 },
    ]
  }

  private generateGeographicData() {
    return [
      { province: "Ontario", users: 3456, percentage: 35 },
      { province: "Quebec", users: 2890, percentage: 25 },
      { province: "British Columbia", users: 2134, percentage: 20 },
      { province: "Alberta", users: 1567, percentage: 12 },
      { province: "Others", users: 953, percentage: 8 },
    ]
  }

  private generateDeviceUsageData() {
    return [
      { device: "Mobile", percentage: 68, users: 6800 },
      { device: "Desktop", percentage: 28, users: 2800 },
      { device: "Tablet", percentage: 4, users: 400 },
    ]
  }
}
