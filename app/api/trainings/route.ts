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

        const { searchParams } = new URL(req.url)
        const status = searchParams.get('status') || 'active'

        const trainings = await Training.find({
            userId: decoded.userId,
            status,
        }).sort({ createdAt: -1 })

        return NextResponse.json({ trainings }, { status: 200 })
    } catch (error) {
        console.error('Get trainings error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function POST(req: NextRequest) {
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

        const body = await req.json()

        const training = await Training.create({
            ...body,
            userId: decoded.userId,
        })

        return NextResponse.json({ training }, { status: 201 })
    } catch (error) {
        console.error('Create training error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}