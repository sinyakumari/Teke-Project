import mongoose, { Schema, Document } from 'mongoose'

export interface ILesson {
    title: string
    order: number
}

export interface IPDF {
    name: string
    url: string
    uploadedAt: Date
}

export interface ITraining extends Document {
    userId: mongoose.Types.ObjectId
    title: string
    instructor: string
    locationType: 'Online' | 'In Person'
    locationName: string
    structure: 'Single Session' | 'Multi-Lesson'
    startDate?: Date
    endDate?: Date
    duration?: number
    unit?: string
    category: 'Tech' | 'Business' | 'Health' | 'Finance' | 'Other'
    vision?: string
    objective?: string
    notes?: string
    lessons: ILesson[]
    pdfs: IPDF[]
    status: 'active' | 'archived'
    createdAt: Date
}

const LessonSchema = new Schema<ILesson>({
    title: { type: String, required: true },
    order: { type: Number, required: true },
})

const PDFSchema = new Schema<IPDF>({
    name: { type: String, required: true },
    url: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
})

const TrainingSchema = new Schema<ITraining>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        instructor: {
            type: String,
            trim: true,
            default: '',
        },
        locationType: {
            type: String,
            enum: ['Online', 'In Person'],
            default: 'Online',
        },
        locationName: {
            type: String,
            trim: true,
            default: '',
        },
        structure: {
            type: String,
            enum: ['Single Session', 'Multi-Lesson'],
            default: 'Single Session',
        },
        startDate: { type: Date },
        endDate: { type: Date },
        duration: { type: Number },
        unit: { type: String },
        category: {
            type: String,
            enum: ['Tech', 'Business', 'Health', 'Finance', 'Other'],
            default: 'Tech',
        },
        vision: { type: String, default: '' },
        objective: { type: String, default: '' },
        notes: { type: String, default: '' },
        lessons: { type: [LessonSchema], default: [] },
        pdfs: { type: [PDFSchema], default: [] },
        status: {
            type: String,
            enum: ['active', 'archived'],
            default: 'active',
        },
    },
    { timestamps: true }
)

export default mongoose.models.Training ||
    mongoose.model<ITraining>('Training', TrainingSchema)