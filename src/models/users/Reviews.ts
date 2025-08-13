 import mongoose, { type Document, Schema } from "mongoose"

 export interface IReview extends Document {
    user: mongoose.Schema.Types.ObjectId
    rating: number
    comment: string
    isPublic: boolean
    createdAt: Date
    updateAt:Date
  }

  export const reviewSchema = new Schema<IReview>({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, required: true },
    isPublic:{type:Boolean,default:false},
    createdAt: { type: Date, default: Date.now },
  },{
    timestamps: true,
    collection: "reviews"
  })

  export const Review = mongoose.model<IReview>("Review", reviewSchema)


