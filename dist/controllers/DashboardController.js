"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const User_1 = require("../models/User");
const Test_1 = require("../models/Test");
const Logger_1 = require("../utils/Logger");
class DashboardController {
    constructor(socketService) {
        this.getDashboardStats = async (req, res) => {
            try {
                const userRole = req.user.role;
                const userId = req.user.userId;
                const [totalUsers, totalTests, totalStudents, totalInstructors, activeTests, recentUsers] = await Promise.all([
                    User_1.User.countDocuments(),
                    Test_1.Test.countDocuments(),
                    User_1.User.countDocuments({ role: "student" }),
                    User_1.User.countDocuments({ role: "instructor" }),
                    Test_1.Test.countDocuments({ isActive: true, isPublished: true }),
                    User_1.User.find({ role: "student" }).sort({ createdAt: -1 }).limit(10).select("name email createdAt lastLogin"),
                ]);
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
                };
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
                ];
                const chartData = this.generateChartData();
                const systemHealth = {
                    status: "healthy",
                    uptime: process.uptime(),
                    memoryUsage: process.memoryUsage(),
                    connectedUsers: this.socketService.getConnectedUsersCount(),
                };
                Logger_1.Logger.info(`Dashboard stats requested by user: ${userId} (${userRole})`);
                res.status(200).json({
                    success: true,
                    data: {
                        stats,
                        recentActivity,
                        chartData,
                        systemHealth,
                        recentUsers: userRole === "admin" ? recentUsers : [],
                    },
                });
            }
            catch (error) {
                Logger_1.Logger.error("Dashboard stats error:", error);
                res.status(500).json({
                    success: false,
                    message: "Failed to fetch dashboard statistics",
                });
            }
        };
        this.getAnalytics = async (req, res) => {
            try {
                const { timeRange = "7d" } = req.query;
                const userRole = req.user.role;
                const analytics = {
                    userGrowth: this.generateUserGrowthData(timeRange),
                    testPerformance: this.generateTestPerformanceData(timeRange),
                    revenueData: this.generateRevenueData(timeRange),
                    geographicData: this.generateGeographicData(),
                    deviceUsage: this.generateDeviceUsageData(),
                };
                res.status(200).json({
                    success: true,
                    data: analytics,
                });
            }
            catch (error) {
                Logger_1.Logger.error("Analytics error:", error);
                res.status(500).json({
                    success: false,
                    message: "Failed to fetch analytics data",
                });
            }
        };
        this.getLiveActivity = async (req, res) => {
            try {
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
                ];
                res.status(200).json({
                    success: true,
                    data: liveActivity,
                });
            }
            catch (error) {
                Logger_1.Logger.error("Live activity error:", error);
                res.status(500).json({
                    success: false,
                    message: "Failed to fetch live activity",
                });
            }
        };
        this.socketService = socketService;
    }
    generateChartData() {
        return [
            { date: "Mon", users: 120, revenue: 1560, tests: 89 },
            { date: "Tue", users: 145, revenue: 1890, tests: 102 },
            { date: "Wed", users: 132, revenue: 1720, tests: 95 },
            { date: "Thu", users: 167, revenue: 2170, tests: 118 },
            { date: "Fri", users: 189, revenue: 2460, tests: 134 },
            { date: "Sat", users: 156, revenue: 2030, tests: 112 },
            { date: "Sun", users: 178, revenue: 2320, tests: 126 },
        ];
    }
    generateUserGrowthData(timeRange) {
        return [
            { period: "Week 1", users: 1200, growth: 12.5 },
            { period: "Week 2", users: 1350, growth: 12.5 },
            { period: "Week 3", users: 1520, growth: 12.6 },
            { period: "Week 4", users: 1710, growth: 12.5 },
        ];
    }
    generateTestPerformanceData(timeRange) {
        return [
            { test: "G1 Knowledge", completions: 456, passRate: 89.2, avgScore: 85.4 },
            { test: "G2 Road Test", completions: 234, passRate: 76.8, avgScore: 78.3 },
            { test: "Defensive Driving", completions: 189, passRate: 92.1, avgScore: 88.7 },
            { test: "Motorcycle Test", completions: 67, passRate: 83.4, avgScore: 81.2 },
        ];
    }
    generateRevenueData(timeRange) {
        return [
            { month: "Oct", revenue: 12500, subscriptions: 245 },
            { month: "Nov", revenue: 15200, subscriptions: 298 },
            { month: "Dec", revenue: 18900, subscriptions: 356 },
            { month: "Jan", revenue: 22100, subscriptions: 412 },
        ];
    }
    generateGeographicData() {
        return [
            { province: "Ontario", users: 3456, percentage: 35 },
            { province: "Quebec", users: 2890, percentage: 25 },
            { province: "British Columbia", users: 2134, percentage: 20 },
            { province: "Alberta", users: 1567, percentage: 12 },
            { province: "Others", users: 953, percentage: 8 },
        ];
    }
    generateDeviceUsageData() {
        return [
            { device: "Mobile", percentage: 68, users: 6800 },
            { device: "Desktop", percentage: 28, users: 2800 },
            { device: "Tablet", percentage: 4, users: 400 },
        ];
    }
}
exports.DashboardController = DashboardController;
//# sourceMappingURL=DashboardController.js.map