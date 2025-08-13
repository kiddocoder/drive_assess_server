/**
 * Main Routes Index
 *
 * Central routing configuration that combines all route modules:
 * - Authentication routes
 * - Dashboard routes
 * - User management routes
 * - Test management routes
 * - Payment routes
 * - File upload routes
 *
 * Route Structure:
 * - /api/auth/* - Authentication endpoints
 * - /api/dashboard/* - Dashboard data endpoints
 * - /api/users/* - User management
 * - /api/tests/* - Test management
 * - /api/payments/* - Payment processing
 * - /api/upload/* - File upload endpoints
 */

import { Router } from "express"
import authRoutes from "./auth"
import dashboardRoutes from "./dashboard"
import userRoutes from "./users"
import testRoutes from "./tests"
import paymentRoutes from "./payments"
import uploadRoutes from "./upload"
import categoryRoutes from "./categories"
import questionRoutes from"./questions"
import roleRoutes from "./roles"
import jwtRoutes from "./jwt";
import assetsRoutes from "./assets"

const router = Router()


// Route modules
router.use("/auth", authRoutes)
router.use("/dashboard", dashboardRoutes)
router.use("/users", userRoutes)
router.use("/questions",questionRoutes)
router.use("/categories",categoryRoutes)
router.use("/tests", testRoutes)
router.use("/payments", paymentRoutes)
router.use("/upload", uploadRoutes)
router.use("/roles",roleRoutes)
router.use("/jwt",jwtRoutes)
router.use("/assets/",assetsRoutes)



export default router
