# Agenter Group System

Modern SaaS-plattform för rapporthantering, CRM och AI-assistenter.

![Next.js](https://img.shields.io/badge/Next.js-15-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Supabase](https://img.shields.io/badge/Supabase-green) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC)

> **📚 Fullständig dokumentation:** Se [SYSTEM_OVERVIEW.md](SYSTEM_OVERVIEW.md) och [docs/](docs/)

---

## ✨ Features

### 📋 **Rapporthantering (V3)**
- **Report Studio** – Skapa och hantera rapportmallar
- **Report Editor** – Redigera rapporter med text och bilder
- **Bildannotering** – Rita pilar och cirklar på bilder
- **PDF Export** – Generera professionella PDF:er
- **Publik delning** – Dela rapporter med kunder
- **Kundgodkännande** – Signatur och godkännande

### 📅 **Calendar Management**
- **Multiple Views**: Month, Week, and Day calendar views
- **Event Management**: Create, edit, and delete events with full CRUD operations
- **Availability Tracking**: Mark events as available or busy
- **Real-time Updates**: Live synchronization across all devices
- **Contact Integration**: Link events to specific contacts

### 👥 **CRM / Contact Management**
- **Contact Database**: Store and manage contact information (name, email, phone, company, notes)
- **Search & Filter**: Quickly find contacts with powerful search functionality
- **Company Tracking**: Group contacts by company and track relationships
- **Event Association**: Link contacts to calendar events seamlessly

### ✅ **Task Management**
- **Task Organization**: Create and manage tasks with due dates
- **Status Tracking**: Track progress with todo/in-progress/done statuses
- **Contact & Event Linking**: Associate tasks with specific contacts or events
- **Priority Management**: Organize tasks by importance and deadlines

### 📊 **Dashboard & Analytics**
- **Overview Widgets**: Quick stats on today's events, pending tasks, and contacts
- **Upcoming Events**: See your next scheduled meetings at a glance
- **Task Summary**: Track pending and completed tasks
- **Activity Insights**: Understand your productivity patterns

### 🤖 **AI-assistenter**
- **Vapi Integration** – Röst- och chattassistenter
- **Samtalsanalys** – Analysera AI-samtal
- **White-label** – Anpassningsbar för varje organisation

### 🔐 **Authentication & Security**
- **Supabase Auth**: Secure email/password and Google OAuth login
- **Row-Level Security**: Each user only sees their own data
- **Multi-tenant**: Stöd för flera organisationer
- **Session Management**: Automatic session handling and refresh

## 🚀 Tech Stack

- **Frontend**: Next.js 15 with App Router, TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: Zustand (lightweight and performant)
- **Database**: Supabase (PostgreSQL with real-time capabilities)
- **Authentication**: Supabase Auth
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Deployment**: Vercel-ready

## 🛠 Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm/yarn/pnpm
- Supabase account

### 1. Clone the Repository
```bash
git clone <repository-url>
cd calendar-crm
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Copy the environment variables:

```bash
cp env.example .env.local
```

4. Update `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 4. Set Up Database Schema

Run the SQL schema in your Supabase SQL editor:

```sql
-- Copy and paste the contents of supabase/schema.sql
-- This will create all necessary tables, RLS policies, and triggers
```

### 5. Configure Authentication

In your Supabase dashboard:
1. Go to Authentication > Settings
2. Enable email authentication
3. (Optional) Configure Google OAuth:
   - Go to Authentication > Providers
   - Enable Google provider
   - Add your Google OAuth credentials

### 6. Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🧹 Linting & Formatting

This project uses Biome for linting and formatting.

Run checks (read-only):

```bash
npm run lint
```

Apply formatting fixes:

```bash
npm run format
```

Apply autofixable lint rules:

```bash
npx @biomejs/biome check --apply
```

## 📁 Project Structure

```
calendar-crm/
├── app/                          # Next.js 15 App Router
│   ├── (dashboard)/              # Shared dashboard layout for feature routes
│   │   ├── analytics/            # Analytics pages (e.g., /analytics)
│   │   ├── calendar/             # /calendar
│   │   ├── campaigns/            # /campaigns
│   │   ├── contacts/             # /contacts
│   │   ├── dashboard/            # /dashboard (main dashboard page)
│   │   ├── settings/             # /settings/*
│   │   ├── tasks/                # /tasks
│   │   └── layout.tsx            # Sidebar + protected route wrapper
│   ├── (analytics)/              # Optional analytics-specific layout
│   ├── (crm)/                    # Optional CRM-specific layout
│   ├── api/                      # Route handlers
│   ├── auth/                     # Authentication pages
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home (server redirect to /dashboard or /auth/login)
├── components/                   # Reusable React components (shadcn/ui based)
├── lib/                          # Utilities, state, and clients
│   ├── supabase/                 # Canonical Supabase clients (server + types)
│   │   ├── server.ts             # createServerClient(..), createServerClientForRoute(..)
│   │   └── service.ts            # createServiceClient(..) for server-only tasks
│   ├── supabase.ts               # createSupabaseClient(..), IS_DEMO_MODE, Database types
│   ├── auth.ts                   # Auth helper around Supabase
│   ├── store.ts                  # Zustand stores and data helpers
│   ├── utils.ts                  # Utility helpers
│   └── logger.ts                 # Logging
├── supabase/                     # Database schema and migrations
│   └── schema.sql                # Complete database schema
└── public/                       # Static assets
```

### Supabase Client Consolidation
- Client-side: `createSupabaseClient()` from `lib/supabase.ts` with a safe demo fallback when env vars are missing.
- Server-side (RSC/Route Handlers): `createServerClient()` and `createServerClientForRoute()` from `lib/supabase/server.ts`.
- Service role (server-only tasks): `createServiceClient()` from `lib/supabase/service.ts`.

All historical duplicates in `utils/supabase/*` have been deprecated and can be removed.

## 🎯 Usage Guide

### Getting Started
1. **Sign Up**: Create an account using email/password or Google OAuth
2. **Dashboard**: View your overview with today's events and pending tasks
3. **Add Contacts**: Start by adding your contacts in the Contacts section
4. **Schedule Events**: Create calendar events and link them to contacts
5. **Manage Tasks**: Add tasks and associate them with contacts or events

### Key Features

#### Calendar Views
- **Month View**: See all events for the month in a traditional calendar layout
- **Week View**: Detailed hourly view of your week with time slots
- **Day View**: Focus on a single day with detailed event information

#### Contact Management
- Add contacts with full details (name, email, phone, company, notes)
- Search and filter contacts quickly
- View contact statistics and company groupings
- Edit or delete contacts with confirmation prompts

#### Task Management
- Create tasks with optional due dates
- Link tasks to specific contacts or events
- Track progress with status updates (todo/in-progress/done)
- Filter tasks by status and search by title

## 🔧 Configuration

### Environment Variables
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Webhook Signing
# Used to sign outbound webhooks sent by the CRM to your endpoints (e.g. n8n)
# Example: openssl rand -hex 32
WEBHOOK_SIGNING_SECRET=replace_with_strong_random_hex
```

### Database Configuration
The application uses Supabase with Row Level Security (RLS) enabled. Each user can only access their own data through automatically enforced security policies.

### Webhook Signing & Verification

Outbound webhooks are signed with an HMAC SHA-256 using `WEBHOOK_SIGNING_SECRET`.

- Headers set by CRM: `X-Timestamp`, `X-Signature`, `X-Event`, `X-Webhook-Source`.
- Signature is calculated as: `hex(HMAC_SHA256(WEBHOOK_SIGNING_SECRET, X-Timestamp + '.' + rawBody))`.
- Reject requests if timestamp is too old (e.g. > 5 minutes) to prevent replay.

Example verification (Node.js/Express):

```ts
import crypto from 'crypto'

function verify(signature: string, timestamp: string, rawBody: string, secret: string) {
  const expected = crypto.createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex')
  return expected.length === signature.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}
```

Rate limit headers returned by `/api/integrations/n8n` (per API-nyckel):

```
X-RateLimit-Limit: <max>
X-RateLimit-Remaining: <remaining>
X-RateLimit-Reset: <ISO date>
```

## 🚀 Deployment

### Deploy to Vercel
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Deploy to Other Platforms
The application is a standard Next.js app and can be deployed to any platform that supports Node.js applications.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](../../issues) page for existing solutions
2. Create a new issue with detailed information
3. Contact the development team

## 🎉 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Supabase](https://supabase.com/) for the backend-as-a-service platform
- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Lucide](https://lucide.dev/) for the clean, consistent icons

---

**Calendar CRM** - Built with ❤️ for modern productivity
