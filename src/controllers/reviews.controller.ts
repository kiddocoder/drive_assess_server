import type { Request, Response } from "express"
import {  Review } from "../models/users/Reviews"

interface AuthRequest extends Request {
  user?: {
    userId: string
    role: string
  }
}

export class ReviewsController {

    public  getAllReviews = async (req:Request,res:Response):Promise<void> =>{

        const reviews = await Review.find().populate("user", "name email");

        res.send(reviews);
    }


    public createReview =async (req:AuthRequest,res:Response):Promise<void> => {
        const { comment, rating } = req.body;
        const userId =  req.user?.userId;

        const review = new Review({
            user: userId,
            comment,
            rating
        });

        try {
            await review.save();
            res.status(201).send(review);
        } catch (error) {
            res.status(400).send(error);
        }
    }

    public deleteReviews = async (req:Request,res:Response):Promise<void> => {
        const reviewIds = req.body.reviewIds;

        try {
            await Review.deleteMany({ _id: { $in: reviewIds } });
            res.status(200).send("Reviews deleted successfully");
        } catch (error) {
            res.status(400).send(error);
        }
    }

    public deleteReview = async (req:Request,res:Response):Promise<void> => {
        const reviewId = req.params.id;
         try {
            const review = await Review.findById(reviewId);
            if (!review) {
                res.status(404).send("Review not found");
                return;
            }
            await review.deleteOne();  
            
        }catch(error){
            res.status(500).send({message:"Internal server error"})
        }
    }

    public updateReview = async (req:Request,res:Response):Promise<void> => {
        const reviewId = req.params.id;
        const { comment, rating,isPublic } = req.body;

        try {
            const review = await Review.findById(reviewId);
            if (!review) {
                res.status(404).send("Review not found");
                return;
            }
            review.comment = comment;
            review.rating = rating;
            review.isPublic = isPublic;
            await review.save();
            res.status(200).send(review);
        } catch (error) {
            res.status(400).send(error);
        }
    }

    public togglePublic = async (req:Request,res:Response):Promise<void> => {
        const reviewIds = req.body.reviewIds;

        try {
            await Review.updateMany({ _id: { $in: reviewIds } }, { $set: { isPublic: true } });
            res.status(200).send("Reviews updated successfully");
        } catch (error) {
            res.status(400).send(error);
        }
    }

}

export default new ReviewsController;