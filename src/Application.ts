/**
 * Application class represents the main application setup
 * it gonna setup for us some : 
 *  - environment variables
 *  - and initialize a new express app
 */
import express from "express";
import dotenv from "dotenv";

export default class Application {
    public app: express.Application;
  
    constructor() {
        this.app = express();
        this.environment();
    }

    private environment() {
        dotenv.config();
    }

    public start():express.Application{
        return this.app;
    }
}
