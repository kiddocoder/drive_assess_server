import mongoose, { type Document, Schema } from "mongoose"

 export interface IMetadata extends Document {
      payment: mongoose.Types.ObjectId
      ipAddress?: string
      userAgent?: string
      couponCode?: string
      discount?: number
}

export const metadataSchema = new Schema<IMetadata>({
      payment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment", required: true },
      ipAddress: { type: String, trim: true },
      userAgent: { type: String, trim: true },
      couponCode: { type: String, trim: true, uppercase: true },
      discount: { type: Number, min: [0, "Discount cannot be negative"], max: [100, "Discount cannot exceed 100%"] },
    },{
      timestamps: true,
      collection: "metadatas"
})

export const Metadata = mongoose.model<IMetadata>("Metadata", metadataSchema)