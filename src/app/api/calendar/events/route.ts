import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { decryptToken, encryptToken } from '@/lib/crypto'
import { verifyCsrf, rateLimit, getClientIp } from '@/lib/security'

const EVENT_ID_RE = /^[a-zA-Z0-9_\-]+$/
const MAX_TASK_NAME = 200

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CALENDAR_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  const data = await res.json()
  return data.access_token || null
}

export async function POST(request: NextRequest) {
  if (!verifyCsrf(request)) return NextResponse.json({ error: 'Invalid request' }, { status: 403 })
  const ip = getClientIp(request)
  if (!rateLimit(`cal:${ip}`, 10, 60_000)) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { taskName?: string; startTime?: string; duration?: number }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }) }

  const { taskName, startTime, duration } = body

  if (!taskName || typeof taskName !== 'string' || taskName.trim().length === 0) {
    return NextResponse.json({ error: 'Missing or invalid taskName' }, { status: 400 })
  }
  if (!startTime || Number.isNaN(Date.parse(startTime))) {
    return NextResponse.json({ error: 'Missing or invalid startTime' }, { status: 400 })
  }
  if (typeof duration !== 'number' || duration <= 0 || duration > 480) {
    return NextResponse.json({ error: 'Duration must be between 1 and 480 minutes' }, { status: 400 })
  }

  const safeTaskName = taskName.trim().slice(0, MAX_TASK_NAME)

  const { data: conn } = await supabase
    .from('user_connections')
    .select('*')
    .eq('user_id', user.id)
    .eq('provider', 'google_calendar')
    .single()

  if (!conn) {
    return NextResponse.json({ error: 'Calendar not connected' }, { status: 400 })
  }

  let accessToken: string
  try { accessToken = await decryptToken(conn.access_token) } catch {
    return NextResponse.json({ error: 'Invalid token, reconnect calendar' }, { status: 401 })
  }

  if (conn.expires_at && new Date(conn.expires_at) <= new Date()) {
    if (!conn.refresh_token) {
      return NextResponse.json({ error: 'Token expired, reconnect calendar' }, { status: 401 })
    }
    let refreshPlain: string
    try { refreshPlain = await decryptToken(conn.refresh_token) } catch {
      return NextResponse.json({ error: 'Invalid token, reconnect calendar' }, { status: 401 })
    }
    const newToken = await refreshAccessToken(refreshPlain)
    if (!newToken) {
      return NextResponse.json({ error: 'Failed to refresh token' }, { status: 401 })
    }
    accessToken = newToken
    const encryptedNew = await encryptToken(newToken)
    await supabase.from('user_connections').update({
      access_token: encryptedNew,
      expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
    }).eq('id', conn.id)
  }

  const start = new Date(startTime)
  const end = new Date(start.getTime() + duration * 60 * 1000)

  const eventRes = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: `Focus: ${safeTaskName}`,
        description: `Scheduled by Flow — ${duration}min focus session`,
        start: { dateTime: start.toISOString() },
        end: { dateTime: end.toISOString() },
        reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 5 }] },
      }),
    }
  )

  if (!eventRes.ok) {
    console.error('Google Calendar API error:', eventRes.status)
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }

  const event = await eventRes.json()
  return NextResponse.json({ success: true, eventId: event.id })
}

export async function DELETE(request: NextRequest) {
  if (!verifyCsrf(request)) return NextResponse.json({ error: 'Invalid request' }, { status: 403 })
  const ip = getClientIp(request)
  if (!rateLimit(`cal:${ip}`, 10, 60_000)) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { eventId?: string }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }) }

  const { eventId } = body
  if (!eventId || typeof eventId !== 'string' || !EVENT_ID_RE.test(eventId)) {
    return NextResponse.json({ error: 'Invalid eventId format' }, { status: 400 })
  }

  const { data: conn } = await supabase
    .from('user_connections')
    .select('*')
    .eq('user_id', user.id)
    .eq('provider', 'google_calendar')
    .single()

  if (!conn) {
    return NextResponse.json({ error: 'Calendar not connected' }, { status: 400 })
  }

  let accessToken: string
  try { accessToken = await decryptToken(conn.access_token) } catch {
    return NextResponse.json({ error: 'Invalid token, reconnect calendar' }, { status: 401 })
  }

  if (conn.expires_at && new Date(conn.expires_at) <= new Date()) {
    if (!conn.refresh_token) {
      return NextResponse.json({ error: 'Token expired' }, { status: 401 })
    }
    let refreshPlain: string
    try { refreshPlain = await decryptToken(conn.refresh_token) } catch {
      return NextResponse.json({ error: 'Invalid token, reconnect calendar' }, { status: 401 })
    }
    const newToken = await refreshAccessToken(refreshPlain)
    if (!newToken) {
      return NextResponse.json({ error: 'Failed to refresh token' }, { status: 401 })
    }
    accessToken = newToken
    const encryptedNew = await encryptToken(newToken)
    await supabase.from('user_connections').update({
      access_token: encryptedNew,
      expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
    }).eq('id', conn.id)
  }

  const deleteRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  )

  if (!deleteRes.ok && deleteRes.status !== 404) {
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
