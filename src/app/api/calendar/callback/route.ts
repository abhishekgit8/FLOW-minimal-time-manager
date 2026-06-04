import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { encryptToken } from '@/lib/crypto'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error || !code || !state) {
    return NextResponse.redirect(`${origin}/dashboard/settings?calendar=error`)
  }

  const cookieStore = await cookies()
  const expectedState = cookieStore.get('gcal_oauth_state')?.value
  cookieStore.delete('gcal_oauth_state')

  if (!expectedState || state !== expectedState) {
    return NextResponse.redirect(`${origin}/dashboard/settings?calendar=error`)
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CALENDAR_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/callback`,
      grant_type: 'authorization_code',
    }),
  })

  const tokenData = await tokenResponse.json()

  if (!tokenData.access_token) {
    return NextResponse.redirect(`${origin}/dashboard/settings?calendar=error`)
  }

  const encryptedAccess = await encryptToken(tokenData.access_token)
  const encryptedRefresh = tokenData.refresh_token ? await encryptToken(tokenData.refresh_token) : null

  const { error: upsertError } = await supabase.from('user_connections').upsert({
    user_id: user.id,
    provider: 'google_calendar',
    access_token: encryptedAccess,
    refresh_token: encryptedRefresh,
    expires_at: tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null,
  }, { onConflict: 'user_id,provider' })

  if (upsertError) {
    console.error('Failed to store calendar connection')
    return NextResponse.redirect(`${origin}/dashboard/settings?calendar=error`)
  }

  return NextResponse.redirect(`${origin}/dashboard/settings?calendar=connected`)
}
