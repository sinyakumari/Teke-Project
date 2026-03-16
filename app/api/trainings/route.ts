import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Training from '@/models/Training'
import { verifyToken } from '@/lib/auth'

export async function GET(req: NextRequest) {
    try {
        await connectDB()

        const token = req.cookies.get('token')?.value
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const decoded = verifyToken(token)
        if (!decoded) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        }

        const trainings = await Training.find({ userId: decoded.userId }).sort({ createdAt: -1 })
        
        return NextResponse.json({ trainings }, { status: 200 })
    } catch (error) {
        console.error('Fetch trainings error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}