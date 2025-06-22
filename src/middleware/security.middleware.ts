import Application from "../Application";
import cors from "cors"
import helmet from "helmet"
import compression from "compression"
import morgan from "morgan"
import rateLimit from "express-rate-limit"
import { Logger } from "../utils/Logger";
import express from "express"


export class SecurityMiddleware{
    private app:express.Application;
    constructor(){

     this.app = new Application().start() // initialize our app
     this.server();
    }

    private server(){
            this.app.use(
          helmet({
            crossOriginEmbedderPolicy: false,
            contentSecurityPolicy: {
              directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
              },
            },
          }),
        )


         this.app.use(
              cors({
                origin: process.env.FRONTEND_URL || "http://localhost:3000",
                credentials: true,
                methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
                allowedHeaders: ["Content-Type", "Authorization"],
              }),
            )

                // Rate limiting
                const limiter = rateLimit({
                  windowMs: 15 * 60 * 1000, // 15 minutes
                  max: 100, // limit each IP to 100 requests per windowMs
                  message: "Too many requests from this IP, please try again later.",
                  standardHeaders: true,
                  legacyHeaders: false,
                })
                this.app.use("/api/", limiter)
            
                // Body parsing and compression
                this.app.use(compression())
                this.app.use(express.json({ limit: "10mb" }))
                this.app.use(express.urlencoded({ extended: true, limit: "10mb" }))
            
                // Logging
                this.app.use(
                  morgan("combined", {
                    stream: { write: (message) => Logger.info(message.trim()) },
                  }),
                )
    }
}