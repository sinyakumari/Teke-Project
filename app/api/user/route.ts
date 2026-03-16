import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
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

        const user = await User.findById(decoded.userId).select('-password')
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        return NextResponse.json({ user }, { status: 200 })
    } catch (error) {
        console.error('Get user error:', error)
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

        const { name, email, profilePicture, appLock, reviewReminders, phone, address, bio } = await req.json()

        const updateData: any = {}
        if (name !== undefined) updateData.name = name
        if (email !== undefined) updateData.email = email
        if (profilePicture !== undefined) {
             updateData.profilePicture = profilePicture
        }
        if (appLock !== undefined) updateData.appLock = appLock
        if (reviewReminders !== undefined) updateData.reviewReminders = reviewReminders
        if (phone !== undefined) updateData.phone = phone
        if (address !== undefined) updateData.address = address
        if (bio !== undefined) updateData.bio = bio

        const user = await User.findByIdAndUpdate(
            decoded.userId,
            updateData,
            { new: true }
        ).select('-password')

        return NextResponse.json({ user }, { status: 200 })
    } catch (error) {
        console.error('Update user error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}