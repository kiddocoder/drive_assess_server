 import mongoose, { type Document, Schema } from "mongoose"

    export interface IProfile extends Document {
      user: mongoose.Types.ObjectId
      avatar?: string
      bio?: string
      specialization?: string[]
      experience?: number
      certifications?: string[]
      rating?: number
      studentsCount?: number
      testsCreated?: number
    }

   export  const profileSchema = new Schema<IProfile>({
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      avatar: { type: String, default: null },
      bio: { type: String, maxlength: 500 },
      specialization: [{ type: String, trim: true }],
      experience: { type: Number, min: 0, max: 50 },
      certifications: [{ type: String, trim: true }],
      rating: { type: Number, min: 0, max: 5, default: 0 },
      studentsCount: { type: Number, default: 0, min: 0 },
      testsCreated: { type: Number, default: 0, min: 0 },
    },{
      timestamps: true,
      collection: "profiles"
    })

    export const Profile = mongoose.model<IProfile>("Profile", profileSchema)
    