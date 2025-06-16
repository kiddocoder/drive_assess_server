"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketService = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Logger_1 = require("../utils/Logger");
class SocketService {
    constructor(httpServer) {
        this.connectedUsers = new Map();
        this.io = new socket_io_1.Server(httpServer, {
            cors: {
                origin: process.env.FRONTEND_URL || "http://localhost:3000",
                methods: ["GET", "POST"],
                credentials: true,
            },
            transports: ["websocket", "polling"],
        });
    }
    initialize() {
        this.io.use(this.authenticateSocket.bind(this));
        this.io.on("connection", this.handleConnection.bind(this));
        Logger_1.Logger.info("🔌 Socket.IO service initialized");
    }
    async authenticateSocket(socket, next) {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(" ")[1];
            if (!token) {
                return next(new Error("Authentication token required"));
            }
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.userId;
            socket.userRole = decoded.role;
            next();
        }
        catch (error) {
            Logger_1.Logger.error("Socket authentication failed:", error);
            next(new Error("Invalid authentication token"));
        }
    }
    handleConnection(socket) {
        const userId = socket.userId;
        const userRole = socket.userRole;
        this.connectedUsers.set(userId, socket.id);
        Logger_1.Logger.info(`👤 User connected: ${userId} (${userRole}) - Socket: ${socket.id}`);
        socket.join(`role:${userRole}`);
        socket.join(`user:${userId}`);
        this.broadcastUserStatus(userId, "online");
        socket.on("dashboard:subscribe", () => {
            socket.join("dashboard");
            Logger_1.Logger.info(`📊 User ${userId} subscribed to dashboard updates`);
        });
        socket.on("test:join", (testId) => {
            socket.join(`test:${testId}`);
            Logger_1.Logger.info(`📝 User ${userId} joined test session: ${testId}`);
        });
        socket.on("test:leave", (testId) => {
            socket.leave(`test:${testId}`);
            Logger_1.Logger.info(`📝 User ${userId} left test session: ${testId}`);
        });
        socket.on("test:progress", (data) => {
            socket.to(`test:${data.testId}`).emit("test:progress:update", {
                userId,
                ...data,
                timestamp: new Date(),
            });
        });
        socket.on("notification:read", (notificationId) => {
            Logger_1.Logger.info(`📬 User ${userId} read notification: ${notificationId}`);
        });
        socket.on("disconnect", (reason) => {
            this.connectedUsers.delete(userId);
            this.broadcastUserStatus(userId, "offline");
            Logger_1.Logger.info(`👋 User disconnected: ${userId} - Reason: ${reason}`);
        });
        socket.emit("connection:success", {
            message: "Connected to DriveReady real-time service",
            userId,
            userRole,
            timestamp: new Date(),
        });
    }
    broadcastDashboardUpdate(data) {
        this.io.to("dashboard").emit("dashboard:update", {
            ...data,
            timestamp: new Date(),
        });
        Logger_1.Logger.info("📊 Dashboard update broadcasted");
    }
    notifyTestStart(testId, studentId, testData) {
        this.io.to(`test:${testId}`).emit("test:started", {
            testId,
            studentId,
            testData,
            timestamp: new Date(),
        });
        this.io.to("role:instructor").to("role:admin").emit("test:session:started", {
            testId,
            studentId,
            testData,
            timestamp: new Date(),
        });
        Logger_1.Logger.info(`📝 Test start notification sent for test: ${testId}`);
    }
    notifyTestCompletion(testId, studentId, results) {
        this.io.to(`test:${testId}`).emit("test:completed", {
            testId,
            studentId,
            results,
            timestamp: new Date(),
        });
        this.io.to(`user:${studentId}`).emit("test:results", {
            testId,
            results,
            timestamp: new Date(),
        });
        Logger_1.Logger.info(`✅ Test completion notification sent for test: ${testId}`);
    }
    sendNotification(userId, notification) {
        this.io.to(`user:${userId}`).emit("notification:new", {
            ...notification,
            timestamp: new Date(),
        });
        Logger_1.Logger.info(`📬 Notification sent to user: ${userId}`);
    }
    broadcastSystemAlert(alert) {
        this.io.emit("system:alert", {
            ...alert,
            timestamp: new Date(),
        });
        Logger_1.Logger.info("🚨 System alert broadcasted");
    }
    notifyPaymentUpdate(userId, paymentData) {
        this.io.to(`user:${userId}`).emit("payment:update", {
            ...paymentData,
            timestamp: new Date(),
        });
        Logger_1.Logger.info(`💳 Payment update sent to user: ${userId}`);
    }
    broadcastUserStatus(userId, status) {
        this.io.to("role:instructor").to("role:admin").emit("user:status", {
            userId,
            status,
            timestamp: new Date(),
        });
    }
    getConnectedUsersCount() {
        return this.connectedUsers.size;
    }
    getConnectedUsers() {
        return Array.from(this.connectedUsers.keys());
    }
    isUserConnected(userId) {
        return this.connectedUsers.has(userId);
    }
}
exports.SocketService = SocketService;
//# sourceMappingURL=SocketService.js.map