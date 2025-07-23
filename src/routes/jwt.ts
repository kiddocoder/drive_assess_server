import {Router} from "express";
import controllers from "../controllers/controllers"
import { authenticateToken } from "../middleware/auth.middleware"


const jwtController = new controllers.JwtController();
const router =  Router();


router.use(authenticateToken);

router.post('/generate',jwtController.generateAccessToken);
router.get('/decode/:token',jwtController.decodeToken);


export default router;