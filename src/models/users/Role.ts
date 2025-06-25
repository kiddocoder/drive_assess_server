import mongoose, { type Document, Schema } from "mongoose"

export interface IRole extends Document {
    name: string
    description: string
}

export const roleSchema = new Schema<IRole>({
    name: { type: String, required: true },
    description: { type: String, required: true }, 
},
{
    timestamps: true,
    collection: "roles"
}
)

export const Role = mongoose.model<IRole>("Role", roleSchema)