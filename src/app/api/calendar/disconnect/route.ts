import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyCsrf, rateLimit, getClientIp } from '@/lib/security'

export async function DELETE(request: NextRequest) {
  if (!verifyCsrf(request)) return NextResponse.json({ error: 'Invalid request' }, { status: 403 })
  const ip = getClientIp(request)
  if (!rateLimit(`cal:${ip}`, 10, 60_000)) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await supabase
    .from('user_connections')
    .delete()
    .eq('user_id', user.id)
    .eq('provider', 'google_calendar')

  if (error) {
    console.error('Failed to disconnect calendar:', error.message)
    return NextResponse.json({ error: 'Failed to disconnect calendar' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
