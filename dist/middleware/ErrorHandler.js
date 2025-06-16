"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = exports.errorHandler = void 0;
const Logger_1 = require("../utils/Logger");
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
    Logger_1.Logger.error("Error:", {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
    });
    if (err.name === "CastError") {
        const message = "Resource not found";
        error = { ...error, message, statusCode: 404 };
    }
    if (err.code === 11000) {
        const message = "Duplicate field value entered";
        error = { ...error, message, statusCode: 400 };
    }
    if (err.name === "ValidationError") {
        const message = Object.values(err.errors || {})
            .map((val) => val.message)
            .join(", ");
        error = { ...error, message, statusCode: 400 };
    }
    if (err.name === "JsonWebTokenError") {
        const message = "Invalid token";
        error = { ...error, message, statusCode: 401 };
    }
    if (err.name === "TokenExpiredError") {
        const message = "Token expired";
        error = { ...error, message, statusCode: 401 };
    }
    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
};
exports.errorHandler = errorHandler;
const notFound = (req, res, next) => {
    const error = new Error(`Not found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};
exports.notFound = notFound;
exports.default = exports.errorHandler;
//# sourceMappingURL=ErrorHandler.js.map