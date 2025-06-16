"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const DatabaseService_1 = require("./services/DatabaseService");
const SocketService_1 = require("./services/SocketService");
const Logger_1 = require("./utils/Logger");
const ErrorHandler_1 = require("./middleware/ErrorHandler");
const routes_1 = __importDefault(require("./routes"));
dotenv_1.default.config();
class Server {
    constructor() {
        this.app = (0, express_1.default)();
        this.port = Number.parseInt(process.env.PORT || "5000");
        this.httpServer = (0, http_1.createServer)(this.app);
        this.databaseService = new DatabaseService_1.DatabaseService();
        this.socketService = new SocketService_1.SocketService(this.httpServer);
        this.initializeMiddleware();
        this.initializeRoutes();
        this.initializeErrorHandling();
    }
    initializeMiddleware() {
        this.app.use((0, helmet_1.default)({
            crossOriginEmbedderPolicy: false,
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                },
            },
        }));
        this.app.use((0, cors_1.default)({
            origin: process.env.FRONTEND_URL || "http://localhost:3000",
            credentials: true,
            methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
            allowedHeaders: ["Content-Type", "Authorization"],
        }));
        const limiter = (0, express_rate_limit_1.default)({
            windowMs: 15 * 60 * 1000,
            max: 100,
            message: "Too many requests from this IP, please try again later.",
            standardHeaders: true,
            legacyHeaders: false,
        });
        this.app.use("/api/", limiter);
        this.app.use((0, compression_1.default)());
        this.app.use(express_1.default.json({ limit: "10mb" }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
        this.app.use((0, morgan_1.default)("combined", {
            stream: { write: (message) => Logger_1.Logger.info(message.trim()) },
        }));
        this.app.get("/health", (req, res) => {
            res.status(200).json({
                status: "OK",
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                environment: process.env.NODE_ENV || "development",
            });
        });
    }
    initializeRoutes() {
        this.app.use("/api", routes_1.default);
        this.app.use("*", (req, res) => {
            res.status(404).json({
                success: false,
                message: "Route not found",
                path: req.originalUrl,
            });
        });
    }
    initializeErrorHandling() {
        this.app.use(ErrorHandler_1.errorHandler);
    }
    async start() {
        try {
            await this.databaseService.connect();
            Logger_1.Logger.info("✅ Database connected successfully");
            this.socketService.initialize();
            Logger_1.Logger.info("✅ Socket.IO initialized");
            this.httpServer.listen(this.port, () => {
                Logger_1.Logger.info(`🚀 Server running on port ${this.port}`);
                Logger_1.Logger.info(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
                Logger_1.Logger.info(`📡 Socket.IO enabled on same port`);
                Logger_1.Logger.info(`🇨🇦 DriveReady Backend - Ready to serve!`);
            });
            this.setupGracefulShutdown();
        }
        catch (error) {
            Logger_1.Logger.error("❌ Failed to start server:", error);
            process.exit(1);
        }
    }
    setupGracefulShutdown() {
        const shutdown = async (signal) => {
            Logger_1.Logger.info(`📴 Received ${signal}. Starting graceful shutdown...`);
            this.httpServer.close(async () => {
                Logger_1.Logger.info("🔌 HTTP server closed");
                try {
                    await this.databaseService.disconnect();
                    Logger_1.Logger.info("🗄️ Database disconnected");
                    Logger_1.Logger.info("✅ Graceful shutdown completed");
                    process.exit(0);
                }
                catch (error) {
                    Logger_1.Logger.error("❌ Error during shutdown:", error);
                    process.exit(1);
                }
            });
            setTimeout(() => {
                Logger_1.Logger.error("⚠️ Forced shutdown after timeout");
                process.exit(1);
            }, 30000);
        };
        process.on("SIGTERM", () => shutdown("SIGTERM"));
        process.on("SIGINT", () => shutdown("SIGINT"));
    }
}
const server = new Server();
server.start()
    .then(() => {
    Logger_1.Logger.info("✅ Server started successfully");
})
    .catch((error) => {
    Logger_1.Logger.error("💥 Fatal error starting server:", error);
    process.exit(1);
});
