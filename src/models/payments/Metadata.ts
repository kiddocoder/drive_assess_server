import mongoose, { type Document, Schema } from "mongoose"

 export interface IMetadata extends Document {
      ipAddress?: string
      userAgent?: string
      fingerprintId?: string
      couponCode?: string
      discount?: number
}

export const metadataSchema = new Schema<IMetadata>({
      ipAddress: { type: String, trim: true },
      userAgent: { type: String, trim: true },
      fingerprintId: { type: String, trim: true },
      couponCode: { type: String, trim: true, uppercase: true },
      discount: { type: Number, min: [0, "Discount cannot be negative"], max: [100, "Discount cannot exceed 100%"] },
    },{
      timestamps: true,
      collection: "metadatas"
})

export const Metadata = mongoose.model<IMetadata>("Metadata", metadataSchema)