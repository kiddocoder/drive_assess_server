 import mongoose, { type Document, Schema } from "mongoose"
 export interface IPreference extends Document {
      user: mongoose.Types.ObjectId 
      language: string
      timezone: string
      notifications: {
        email: boolean
        push: boolean
        sms: boolean
      }
    }

    export const preferenceSchema = new Schema<IPreference>({
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      language: {
        type: String,
        default: "en",
      },
      timezone: {
        type: String,
        default: "UTC",
      },
      notifications: [{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Notification",
        default: null
      }],
    },{
      timestamps: true,
      collection: "preferences"
    })

 export const Preference = mongoose.model<IPreference>("Preference", preferenceSchema)



   