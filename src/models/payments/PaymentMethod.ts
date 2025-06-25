import mongoose, { type Document, Schema } from "mongoose"

export interface IPaymentMethod extends Document {
    type: string
}

export const paymentMethodSchema = new Schema<IPaymentMethod>({
    type: { type: String, required: true },
}, {
    timestamps: true,
    collection: "paymentMethods"
})

export const PaymentMethod = mongoose.model<IPaymentMethod>("PaymentMethod", paymentMethodSchema)