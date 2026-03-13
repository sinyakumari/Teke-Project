import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Task from '@/models/Task'
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
        const trainingId = searchParams.get('trainingId')
        const status = searchParams.get('status')

        const query: Record<string, unknown> = { userId: decoded.userId }
        if (trainingId) query.trainingId = trainingId
        if (status) query.status = status

        const tasks = await Task.find(query)
            .populate('trainingId', 'title')
            .populate('blockedBy', 'name')
            .sort({ createdAt: -1 })

        return NextResponse.json({ tasks }, { status: 200 })
    } catch (error) {
        console.error('Get tasks error:', error)
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

        const task = await Task.create({
            ...body,
            userId: decoded.userId,
        })

        return NextResponse.json({ task }, { status: 201 })
    } catch (error) {
        console.error('Create task error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function PUT(req: NextRequest) {
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
        const { taskId, ...updates } = body

        const task = await Task.findOneAndUpdate(
            { _id: taskId, userId: decoded.userId },
            updates,
            { new: true }
        )

        if (!task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 })
        }

        return NextResponse.json({ task }, { status: 200 })
    } catch (error) {
        console.error('Update task error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function DELETE(req: NextRequest) {
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
        const taskId = searchParams.get('taskId')

        await Task.findOneAndDelete({ _id: taskId, userId: decoded.userId })

        return NextResponse.json({ message: 'Task deleted' }, { status: 200 })
    } catch (error) {
        console.error('Delete task error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}