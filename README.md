# Flow

A minimal, sleek time management web app built for maximum productivity. Focus with a customizable timer, track your sessions and tasks, and stay consistent with streak tracking.

## Features

- **Customizable Timer** — Set any focus/break duration, fullscreen mode for presentations, floating draggable widget
- **Task Management** — Create, organize, and prioritize tasks with categories and time estimates
- **Focus Mode** — Link a task to your timer to track what you're working on
- **Session History** — View completed focus sessions grouped by date with filters
- **Stats Dashboard** — Focus score, daily focus time, sessions count, task completion, streaks, and weekly chart
- **Dark/Light Theme** — Toggle between themes with persistent preference
- **Responsive Design** — Works on desktop and mobile with adaptive navigation
- **Google OAuth** — Sign in with Google or email/password via Supabase Auth

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + CSS Variables |
| Auth | Supabase Auth (Google OAuth + Email/Password) |
| Database | Supabase PostgreSQL with Row Level Security |
| Hosting | Vercel |
| Icons | Lucide React |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### Setup

1. Clone the repo:
   ```bash
   git clone <your-repo-url>
   cd flow-saas
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. Run the SQL schema in Supabase SQL Editor (see `supabase/schema.sql`)

5. Enable Google OAuth in Supabase Dashboard → Authentication → Providers

6. Start the dev server:
   ```bash
   npm run dev
   ```

### Deploy to Vercel

1. Push to GitHub
2. Import repo on [vercel.com](https://vercel.com)
3. Add env variables in Vercel project settings
4. Deploy

After deployment, update Supabase URL Configuration:
- **Site URL**: `https://your-project.vercel.app`
- **Redirect URLs**: `https://your-project.vercel.app/auth/callback`

## Project Structure

```
flow-saas/
├── src/
│   ├── app/
│   │   ├── (auth)/          # Login & Signup pages
│   │   ├── auth/callback/   # OAuth callback handler
│   │   ├── dashboard/       # Main app (Home, Tasks, History, Settings)
│   │   ├── globals.css      # Theme system (CSS variables)
│   │   └── layout.tsx       # Root layout
│   ├── components/
│   │   ├── theme-provider.tsx       # Dark/Light theme context
│   │   └── focus-task-provider.tsx  # Focus task context
│   ├── lib/
│   │   └── supabase/        # Supabase client, server, middleware
│   └── middleware.ts         # Auth middleware
├── supabase/
│   └── schema.sql           # Database schema
└── .env.local               # Environment variables (not committed)
```

## License

MIT
