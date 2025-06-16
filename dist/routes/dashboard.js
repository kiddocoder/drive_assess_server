"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const DashboardController_1 = require("../controllers/DashboardController");
const auth_1 = require("../middleware/auth");
const SocketService_1 = require("../services/SocketService");
const router = (0, express_1.Router)();
const socketService = new SocketService_1.SocketService();
const dashboardController = new DashboardController_1.DashboardController(socketService);
router.use(auth_1.authenticateToken);
router.get("/stats", dashboardController.getDashboardStats);
router.get("/analytics", dashboardController.getAnalytics);
router.get("/live-activity", dashboardController.getLiveActivity);
exports.default = router;
//# sourceMappingURL=dashboard.js.map