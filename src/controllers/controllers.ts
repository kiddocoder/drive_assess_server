

import authController from "./auth.controller";
import { CategoryController } from "./category.controller";
import { DashboardController } from "./dashboard.controller";
import {PaymentController} from "./payment.controller";
import {QuestionController} from "./question.controller";
import {TestController} from "./tests.controller";
import {UserController} from "./user.controller";
import {JwtController} from "./jwt.controller"



const controllers = {
    authController,
    CategoryController,
    TestController,
    DashboardController,
    PaymentController,
    QuestionController,
    UserController,
    JwtController
}

export default controllers;