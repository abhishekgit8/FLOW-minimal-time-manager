import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { ErrorBoundary } from '@/components/error-boundary'

export const metadata: Metadata = {
  title: 'Flow — Time Manager',
  description: 'A minimal time management tool for maximum productivity.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('flow_theme');if(!t)t=window.matchMedia('(prefers-color-scheme:light)').matches?'light':'dark';document.documentElement.setAttribute('data-theme',t)}catch(e){}})()` }} />
      </head>
      <body>
        <ThemeProvider><ErrorBoundary>{children}</ErrorBoundary></ThemeProvider>
      </body>
    </html>
  )
}
