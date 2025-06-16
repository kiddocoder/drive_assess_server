"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = __importDefault(require("./auth"));
const dashboard_1 = __importDefault(require("./dashboard"));
const users_1 = __importDefault(require("./users"));
const tests_1 = __importDefault(require("./tests"));
const payments_1 = __importDefault(require("./payments"));
const upload_1 = __importDefault(require("./upload"));
const router = (0, express_1.Router)();
router.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "DriveReady API is running",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
    });
});
router.use("/auth", auth_1.default);
router.use("/dashboard", dashboard_1.default);
router.use("/users", users_1.default);
router.use("/tests", tests_1.default);
router.use("/payments", payments_1.default);
router.use("/upload", upload_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map