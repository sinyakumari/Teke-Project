import mongoose, { Schema, Document } from 'mongoose'

export interface ITask extends Document {
    userId: mongoose.Types.ObjectId
    trainingId: mongoose.Types.ObjectId
    name: string
    status: 'Pending' | 'In Progress' | 'Complete' | 'Delayed' | 'Canceled'
    deadline?: Date
    blockedBy: mongoose.Types.ObjectId[]
    source: 'manual' | 'pdf'
    pdfPage?: number
    pdfText?: string
    createdAt: Date
}

const TaskSchema = new Schema<ITask>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        trainingId: {
            type: Schema.Types.ObjectId,
            ref: 'Training',
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        status: {
            type: String,
            enum: ['Pending', 'In Progress', 'Complete', 'Delayed', 'Canceled'],
            default: 'Pending',
        },
        deadline: {
            type: Date,
        },
        blockedBy: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Task',
            },
        ],
        source: {
            type: String,
            enum: ['manual', 'pdf'],
            default: 'manual',
        },
        pdfPage: {
            type: Number,
        },
        pdfText: {
            type: String,
            default: '',
        },
    },
    { timestamps: true }
)

export default mongoose.models.Task ||
    mongoose.model<ITask>('Task', TaskSchema)