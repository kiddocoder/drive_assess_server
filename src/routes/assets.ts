import { Router } from "express"
import { authenticateToken } from "../middleware/auth.middleware";
import { User } from "../models/users/User";
import { Subscription } from "../models/users/Subscription";
import {Response,Request} from "express";

interface AuthRequest extends Request {
  user?: {
    userId: string;
  };
}

const router:Router = Router() as Router;

const getPremieumPdf = async (req:AuthRequest, res:Response):Promise<void> => {
  
    const userId =  req.user?.userId;

       
    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    // check for user subscription plan 

    const subscriptions =  await Subscription.find({user:userId})
    const subscription = subscriptions.find((subscription) =>{
      // check if is not expired. 
      const isNotExpired = new Date() < new Date(subscription?.endDate || new Date());

      return subscription.plan === "premium" && subscription.isActive && isNotExpired
    })

    if(!subscription){
     res.status(400).json({success:false,message:"You are not subscribed to a premium plan or your subscription has expired."})
    }else{
    
const fileName = req.params.file_name
  const filePath = `./assets/${fileName}`
  res.sendFile(filePath, { root: "./" }, (err) => {
    if (err) {
        console.log(err)
      res.status(404).json({
        success: false,
        message: "File not found",
      })
    }
  })
    }
}

// router to seve assets files. 
router.get("/:file_name",authenticateToken,getPremieumPdf)
export default router