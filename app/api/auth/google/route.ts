
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUrl } from '@/lib/google-drive'

export async function GET() {
  try {
    const authUrl = getAuthUrl()
    return NextResponse.json({ success: true, authUrl })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to generate auth URL' }, { status: 500 })
  }
}
