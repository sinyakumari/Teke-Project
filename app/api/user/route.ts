import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: settings } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.user_metadata?.name || user.user_metadata?.full_name || '',
        email: user.email,
        profilePicture: user.user_metadata?.profile_picture || user.user_metadata?.avatar_url || '',
        phone: user.user_metadata?.phone || '',
        address: user.user_metadata?.address || '',
        bio: user.user_metadata?.bio || '',
        appLock: settings?.app_lock ?? false,
        reviewReminders: settings?.notifications_enabled ?? true,
      }
    }, { status: 200 })

  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, email, profilePicture, phone, address, bio, appLock, reviewReminders } = body

    // Update info in Supabase Auth Metadata
    if (name || email || profilePicture || phone || address || bio) {
      const { error } = await supabase.auth.updateUser({
        ...(email && { email }),
        data: {
          ...(name && { name }),
          ...(profilePicture && { profile_picture: profilePicture }),
          ...(phone && { phone }),
          ...(address && { address }),
          ...(bio && { bio }),
        }
      })
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    }

    // Update settings in user_settings table
    if (appLock !== undefined || reviewReminders !== undefined) {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ...(appLock !== undefined && { app_lock: appLock }),
          ...(reviewReminders !== undefined && { notifications_enabled: reviewReminders }),
          updated_at: new Date().toISOString(),
        })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    }

    // Fetch updated user to return
    const { data: updatedSettings } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({
      message: 'Updated successfully',
      user: {
        id: user.id,
        name: body.name || user.user_metadata?.name || user.user_metadata?.full_name || '',
        email: body.email || user.email,
        profilePicture: body.profilePicture || user.user_metadata?.profile_picture || user.user_metadata?.avatar_url || '',
        phone: body.phone || user.user_metadata?.phone || '',
        address: body.address || user.user_metadata?.address || '',
        bio: body.bio || user.user_metadata?.bio || '',
        appLock: updatedSettings?.app_lock ?? false,
        reviewReminders: updatedSettings?.notifications_enabled ?? true,
      }
    }, { status: 200 })

  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}