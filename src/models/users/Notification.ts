
/// user notif

 import mongoose, { type Document, Schema } from "mongoose"

 export interface INotification extends Document {
    type:string,
    title:string,
    message:string,
    users: mongoose.Types.ObjectId[] | null,
    image?:string,
    imageUrl?:string
    link?:string
    isRead?:boolean
 }

 export const notificationSchema = new Schema<INotification>({
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }],
    image: { type: String, default: null },
    imageUrl: { type: String, default: null },
    link: { type: String, default: null },
    isRead: { type: Boolean, default: false },
  },{
    timestamps: true,
    collection: "notifications"
  })

 export const Notification = mongoose.model<INotification>("Notification", notificationSchema)