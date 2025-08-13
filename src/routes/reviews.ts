import { Router } from "express"
import reviewsController from "../controllers/reviews.controller";

const router:Router = Router() as Router;


router.post("/",reviewsController.createReview);
router.get("/",reviewsController.getAllReviews);
router.delete("/:id",reviewsController.deleteReview);
router.put("/:id",reviewsController.updateReview);
router.post("/toggle/public",reviewsController.togglePublic);
router.post("/bulk/delete",reviewsController.deleteReviews);


export default router