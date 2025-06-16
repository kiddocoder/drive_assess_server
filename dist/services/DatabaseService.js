"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Logger_1 = require("../utils/Logger");
class DatabaseService {
    constructor() {
        this.isConnected = false;
        this.connectionString = process.env.MONGODB_URI || "mongodb://localhost:27017/driveready";
        this.setupEventListeners();
    }
    async connect() {
        try {
            const options = {
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
                bufferMaxEntries: 0,
                bufferCommands: false,
            };
            await mongoose_1.default.connect(this.connectionString, options);
            this.isConnected = true;
            Logger_1.Logger.info("🗄️ MongoDB connected successfully");
            Logger_1.Logger.info(`📍 Database: ${mongoose_1.default.connection.name}`);
        }
        catch (error) {
            Logger_1.Logger.error("❌ MongoDB connection failed:", error);
            throw error;
        }
    }
    async disconnect() {
        try {
            await mongoose_1.default.disconnect();
            this.isConnected = false;
            Logger_1.Logger.info("🔌 MongoDB disconnected");
        }
        catch (error) {
            Logger_1.Logger.error("❌ Error disconnecting from MongoDB:", error);
            throw error;
        }
    }
    getConnectionStatus() {
        return this.isConnected && mongoose_1.default.connection.readyState === 1;
    }
    getConnectionInfo() {
        return {
            isConnected: this.isConnected,
            readyState: mongoose_1.default.connection.readyState,
            host: mongoose_1.default.connection.host,
            port: mongoose_1.default.connection.port,
            name: mongoose_1.default.connection.name,
        };
    }
    setupEventListeners() {
        mongoose_1.default.connection.on("connected", () => {
            this.isConnected = true;
            Logger_1.Logger.info("🔗 Mongoose connected to MongoDB");
        });
        mongoose_1.default.connection.on("error", (error) => {
            Logger_1.Logger.error("❌ Mongoose connection error:", error);
        });
        mongoose_1.default.connection.on("disconnected", () => {
            this.isConnected = false;
            Logger_1.Logger.warn("⚠️ Mongoose disconnected from MongoDB");
        });
        mongoose_1.default.connection.on("reconnected", () => {
            this.isConnected = true;
            Logger_1.Logger.info("🔄 Mongoose reconnected to MongoDB");
        });
        if (process.env.NODE_ENV === "development") {
            mongoose_1.default.set("debug", true);
        }
    }
}
exports.DatabaseService = DatabaseService;
//# sourceMappingURL=DatabaseService.js.map