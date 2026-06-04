import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL!))
  }

  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/callback`
  const scope = 'https://www.googleapis.com/auth/calendar.events'

  const nonce = crypto.randomUUID()
  const cookieStore = await cookies()
  cookieStore.set('gcal_oauth_state', nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  })

  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  googleAuthUrl.searchParams.set('client_id', clientId!)
  googleAuthUrl.searchParams.set('redirect_uri', redirectUri)
  googleAuthUrl.searchParams.set('response_type', 'code')
  googleAuthUrl.searchParams.set('scope', scope)
  googleAuthUrl.searchParams.set('access_type', 'offline')
  googleAuthUrl.searchParams.set('prompt', 'consent')
  googleAuthUrl.searchParams.set('state', nonce)

  return NextResponse.redirect(googleAuthUrl.toString())
}
