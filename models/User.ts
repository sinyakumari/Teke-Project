import mongoose, { Schema, Document } from 'mongoose'

export interface IUser extends Document {
    name: string
    email: string
    password: string
    profilePicture?: string
    phone?: string
    address?: string
    bio?: string
    lastLogin?: Date
    accountStatus?: string
    appLock?: boolean
    reviewReminders?: boolean
    createdAt: Date
}

const UserSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
        },
        profilePicture: {
            type: String,
            default: '',
        },
        phone: {
            type: String,
            default: '',
        },
        address: {
            type: String,
            default: '',
        },
        bio: {
            type: String,
            default: '',
        },
        lastLogin: {
            type: Date,
            default: Date.now,
        },
        accountStatus: {
            type: String,
            default: 'Active',
        },
        appLock: {
            type: Boolean,
            default: false,
        },
        reviewReminders: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
)

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema)